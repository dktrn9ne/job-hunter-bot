import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { z } from 'zod';

import { openDb } from './db.js';
import { htmlToPdf } from './pdf.js';
import { initSendgrid, sendApplyEmail } from './sendgrid.js';

const env = {
  PORT: Number(process.env.PORT || '8787'),
  DATA_DIR: process.env.DATA_DIR || './data',
  MATCH_THRESHOLD: Number(process.env.MATCH_THRESHOLD || '75'),
  CHROME_PATH: process.env.CHROME_PATH || '',

  // API auth
  BOT_API_TOKEN: process.env.BOT_API_TOKEN || '',

  BASE_RESUME_MUSIC: process.env.BASE_RESUME_MUSIC || '',
  BASE_RESUME_TECH: process.env.BASE_RESUME_TECH || '',
  BASE_RESUME_MARKETING: process.env.BASE_RESUME_MARKETING || '',

  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
  MAIL_FROM: process.env.MAIL_FROM || '',
  MAIL_FROM_NAME: process.env.MAIL_FROM_NAME || 'Maurice Thomas',
  APPLY_EMAIL_SUBJECT: process.env.APPLY_EMAIL_SUBJECT || 'Application: {{title}} — Maurice Thomas'
};

const app = express();
app.use(express.json({ limit: '2mb' }));

function requireAuth(req: express.Request, res: express.Response): boolean {
  // If token not set, run open (dev). For tunnel/prod, set BOT_API_TOKEN.
  if (!env.BOT_API_TOKEN) return true;
  const h = req.header('authorization') || '';
  const ok = h.toLowerCase().startsWith('bearer ') && h.slice(7).trim() === env.BOT_API_TOKEN;
  if (!ok) {
    res.status(401).json({ ok: false, error: 'unauthorized' });
    return false;
  }
  return true;
}

const db = openDb(env.DATA_DIR);

function nowIso() {
  return new Date().toISOString();
}
function id(prefix: string) {
  return `${prefix}_${crypto.randomBytes(12).toString('hex')}`;
}

const ingestSchema = z
  .object({
    sourceUrl: z.string().url().optional(),
    platform: z.enum(["linkedin", "indeed", "ziprecruiter", "upwork", "other"]).default("other"),
    track: z.enum(["TECH", "MARKETING", "PROCESS_TECH"]).optional(),
    baseResume: z.enum(["music", "tech", "marketing"]).optional(),
    company: z.string().optional(),
    title: z.string().optional(),
    location: z.string().optional(),
    jdText: z.string().optional(),
  })
  .refine((v) => (v.jdText && v.jdText.trim().length >= 50) || !!v.sourceUrl, {
    message: "Provide either jdText (>= 50 chars) or sourceUrl",
  });

app.post('/jobs/ingest', (req, res) => {
  if (!requireAuth(req, res)) return;
  const parsed = ingestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });

  const jobId = id('job');
  const ts = nowIso();
  // best-effort migrations for existing sqlite
  try { db.prepare('ALTER TABLE jobs ADD COLUMN track TEXT').run(); } catch {}
  try { db.prepare('ALTER TABLE jobs ADD COLUMN base_resume TEXT').run(); } catch {}
  try { db.prepare('ALTER TABLE jobs ADD COLUMN notes TEXT').run(); } catch {}
  try { db.prepare('ALTER TABLE jobs ADD COLUMN comp_listed TEXT').run(); } catch {}
  try { db.prepare('ALTER TABLE jobs ADD COLUMN comp_market_austin TEXT').run(); } catch {}

  db.prepare(`
    INSERT INTO jobs (id, created_at, updated_at, source_url, platform, company, title, location, jd_text, track, base_resume, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    jobId,
    ts,
    ts,
    parsed.data.sourceUrl || null,
    parsed.data.platform,
    parsed.data.company || null,
    parsed.data.title || null,
    parsed.data.location || null,
    parsed.data.jdText || null,
    parsed.data.track || null,
    parsed.data.baseResume || null,
    'NEW'
  );

  return res.json({ ok: true, jobId });
});

// v1 scoring: simple keyword overlap + heuristics. We'll upgrade later.
app.post('/jobs/:id/score', (req, res) => {
  if (!requireAuth(req, res)) return;
  const jobId = req.params.id;
  const row = db.prepare('SELECT * FROM jobs WHERE id=?').get(jobId) as any;
  if (!row) return res.status(404).json({ ok: false, error: 'not_found' });

  const text = String(row.jd_text || '').toLowerCase();
  const signals = [
    'typescript','javascript','python','sql','react','next.js','node','aws','docker',
    'seo','wordpress','meta ads','google ads','hubspot','klaviyo','cro','ga4',
    'cleanroom','lithography','dry etch','wet etch','metrology'
  ];

  let hits = 0;
  const matched: string[] = [];
  for (const s of signals) {
    if (text.includes(s)) { hits++; matched.push(s); }
  }

  // Basic scale to 0-100
  const score = Math.min(100, Math.round((hits / Math.max(12, signals.length)) * 140));
  const reason = `matched: ${matched.slice(0, 12).join(', ')}`;

  const ts = nowIso();
  db.prepare('UPDATE jobs SET match_score=?, match_reason=?, status=?, updated_at=? WHERE id=?')
    .run(score, reason, 'SCORED', ts, jobId);

  return res.json({ ok: true, score, threshold: env.MATCH_THRESHOLD, reason, pass: score >= env.MATCH_THRESHOLD });
});

const tailorSchema = z.object({
  base: z.enum(["music", "tech", "marketing"]),
  track: z.enum(["TECH", "MARKETING", "PROCESS_TECH"]).optional(),
});

// Tailor (v1): copies base HTML as-is. v2 will apply a deterministic tailoring pipeline.
app.post('/jobs/:id/tailor', async (req, res) => {
  if (!requireAuth(req, res)) return;
  const jobId = req.params.id;
  const parsed = tailorSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });

  const row = db.prepare('SELECT * FROM jobs WHERE id=?').get(jobId) as any;
  if (!row) return res.status(404).json({ ok: false, error: 'not_found' });

  if (!env.CHROME_PATH) return res.status(500).json({ ok: false, error: 'CHROME_PATH_missing' });

  const outDir = path.resolve(env.DATA_DIR, 'out', jobId);
  fs.mkdirSync(outDir, { recursive: true });

  // v1: copy base HTML as-is; v2 will tailor sections/bullets via templates + fact-bank.
  const baseMap: Record<string, string> = {
    music: env.BASE_RESUME_MUSIC,
    tech: env.BASE_RESUME_TECH,
    marketing: env.BASE_RESUME_MARKETING,
  };

  const basePath = baseMap[parsed.data.base];
  if (!basePath || !fs.existsSync(basePath)) {
    return res
      .status(500)
      .json({ ok: false, error: `base_resume_missing:${parsed.data.base}` });
  }

  const resumeHtmlPath = path.join(outDir, `resume_${parsed.data.base}.html`);
  fs.copyFileSync(basePath, resumeHtmlPath);

  // cover letters are now on-demand (separate endpoint). For compatibility, we still create a placeholder.
  const coverHtmlPath = path.join(outDir, 'cover.html');
  fs.writeFileSync(
    coverHtmlPath,
    `<html><body style="font-family:Arial"><h2>Maurice Thomas — Cover Letter</h2><p>Re: ${row.title || 'Role'}</p><p>Dear Hiring Manager,</p><p>(Cover letters are generated on-demand in v2.)</p><p>Sincerely,<br/>Maurice Thomas</p></body></html>`
  );

  const resumePdfPath = path.join(outDir, `resume_${parsed.data.base}.pdf`);
  const coverPdfPath = path.join(outDir, 'cover.pdf');

  await htmlToPdf({
    chromePath: env.CHROME_PATH,
    inputFileUrl: `file:///${resumeHtmlPath.replace(/\\/g,'/')}`,
    outputPdfPath: resumePdfPath
  });
  await htmlToPdf({
    chromePath: env.CHROME_PATH,
    inputFileUrl: `file:///${coverHtmlPath.replace(/\\/g,'/')}`,
    outputPdfPath: coverPdfPath
  });

  const docId = id('doc');
  const ts = nowIso();
  db.prepare(
    `INSERT INTO documents (id, job_id, created_at, base_resume, resume_html_path, resume_pdf_path, cover_html_path, cover_pdf_path)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    docId,
    jobId,
    ts,
    parsed.data.base,
    resumeHtmlPath,
    resumePdfPath,
    coverHtmlPath,
    coverPdfPath
  );

  db.prepare('UPDATE jobs SET status=?, updated_at=?, base_resume=?, track=? WHERE id=?').run(
    'GENERATED',
    ts,
    parsed.data.base,
    parsed.data.track || row.track || null,
    jobId
  );

  return res.json({ ok: true, docId, resumePdfPath, coverPdfPath });
});

const emailApplySchema = z.object({
  jobId: z.string(),
  toEmail: z.string().email(),
});

app.post('/apply/email', async (req, res) => {
  if (!requireAuth(req, res)) return;
  // NOTE: cover letter generation is on-demand; apply will attach latest generated cover.pdf present in documents.

  const parsed = emailApplySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });

  const job = db.prepare('SELECT * FROM jobs WHERE id=?').get(parsed.data.jobId) as any;
  if (!job) return res.status(404).json({ ok: false, error: 'job_not_found' });

  const doc = db.prepare('SELECT * FROM documents WHERE job_id=? ORDER BY created_at DESC LIMIT 1').get(parsed.data.jobId) as any;
  if (!doc) return res.status(400).json({ ok: false, error: 'no_documents_generated' });

  if (!env.SENDGRID_API_KEY) return res.status(500).json({ ok: false, error: 'SENDGRID_API_KEY_missing' });
  if (!env.MAIL_FROM) return res.status(500).json({ ok: false, error: 'MAIL_FROM_missing' });

  initSendgrid(env.SENDGRID_API_KEY);

  const resumeB64 = fs.readFileSync(doc.resume_pdf_path).toString('base64');
  const coverB64 = fs.readFileSync(doc.cover_pdf_path).toString('base64');

  const subject = env.APPLY_EMAIL_SUBJECT.replace('{{title}}', job.title || 'Role');
  const body = `Hello,\n\nPlease find attached my resume and cover letter for ${job.title || 'the role'} at ${job.company || 'your company'}.\n\nThank you for your time and consideration.\n\nSincerely,\nMaurice Thomas\n(737) 497-1806\nmrthomaslmg@gmail.com\n`;

  await sendApplyEmail({
    from: { email: env.MAIL_FROM, name: env.MAIL_FROM_NAME },
    to: parsed.data.toEmail,
    subject,
    text: body,
    attachments: [
      { filename: 'Maurice_Thomas_Resume.pdf', contentBase64: resumeB64, type: 'application/pdf' },
      { filename: 'Maurice_Thomas_Cover_Letter.pdf', contentBase64: coverB64, type: 'application/pdf' }
    ]
  });

  const ts = nowIso();
  db.prepare('UPDATE jobs SET status=?, updated_at=? WHERE id=?').run('APPLIED_EMAIL', ts, parsed.data.jobId);
  return res.json({ ok: true });
});

app.get('/jobs', (req, res) => {
  if (!requireAuth(req, res)) return;
  const rows = db.prepare('SELECT * FROM jobs ORDER BY created_at DESC LIMIT 200').all();
  res.json({ ok: true, jobs: rows });
});

app.get('/jobs/:id/docs/:kind', (req, res) => {
  if (!requireAuth(req, res)) return;
  const jobId = req.params.id;
  const kind = req.params.kind;

  const doc = db
    .prepare('SELECT * FROM documents WHERE job_id=? ORDER BY created_at DESC LIMIT 1')
    .get(jobId) as any;
  if (!doc) return res.status(404).send('no_documents');

  const map: Record<string, string> = {
    'cover.html': doc.cover_html_path,
    'cover.pdf': doc.cover_pdf_path,
    'resume_music.html': doc.resume_html_path,
    'resume_music.pdf': doc.resume_pdf_path,
    'resume_tech.html': doc.resume_html_path,
    'resume_tech.pdf': doc.resume_pdf_path,
    'resume_marketing.html': doc.resume_html_path,
    'resume_marketing.pdf': doc.resume_pdf_path
  };

  const filePath = map[kind] || '';
  if (!filePath || !fs.existsSync(filePath)) return res.status(404).send('doc_not_found');

  if (kind.endsWith('.pdf')) res.type('application/pdf');
  else if (kind.endsWith('.html')) res.type('text/html');
  else res.type('application/octet-stream');

  return res.sendFile(filePath);
});


app.listen(env.PORT, '127.0.0.1', () => {
  // eslint-disable-next-line no-console
  console.log(`job-hunter-bot listening on http://127.0.0.1:${env.PORT}`);
});
