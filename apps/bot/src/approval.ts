import crypto from 'node:crypto';
import fs from 'node:fs';
import type Database from 'better-sqlite3';
import type express from 'express';
import { z } from 'zod';
import { reviewPage } from './review.js';

export const candidateId = 'maurice';
export const approvalEmail = 'mrthomaslmg@gmail.com';
type Mail = { to: string; subject: string; text: string; attachments: Array<{ filename: string; contentBase64: string; type: string }> };
type Options = { candidateToken: string; botToken: string; reviewUrl: string; allowEmployerSend?: boolean; send: (mail: Mail) => Promise<void>; policy: any };
const hash = (value: string) => crypto.createHash('sha256').update(value).digest('hex');
const timestamp = () => new Date().toISOString();
export function installApprovalService(app: express.Express, db: Database.Database, opts: Options) {
  const policy = opts.policy;
  if (policy.candidate_id !== candidateId || policy.application?.approver_candidate_id !== candidateId ||
      policy.application?.submit_only_after_candidate_approval !== true || policy.communication?.approval_email !== approvalEmail ||
      policy.communication?.approval_links_require_authentication !== true) throw new Error('Invalid Maurice approval policy');
  db.exec(`
    CREATE TABLE IF NOT EXISTS candidates (id TEXT PRIMARY KEY, approval_email TEXT NOT NULL);
    INSERT OR IGNORE INTO candidates VALUES ('maurice', 'mrthomaslmg@gmail.com');
    CREATE TABLE IF NOT EXISTS application_packages (
      id TEXT PRIMARY KEY, candidate_id TEXT NOT NULL REFERENCES candidates(id), job_id TEXT NOT NULL REFERENCES jobs(id),
      version INTEGER NOT NULL, created_at TEXT NOT NULL, state TEXT NOT NULL,
      snapshot_json TEXT NOT NULL, digest TEXT NOT NULL, notified_at TEXT,
      UNIQUE(candidate_id, job_id, version)
    );
    CREATE TABLE IF NOT EXISTS approval_audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT, package_id TEXT, actor TEXT NOT NULL,
      action TEXT NOT NULL, created_at TEXT NOT NULL, detail TEXT NOT NULL
    );
    CREATE TRIGGER IF NOT EXISTS audit_no_update BEFORE UPDATE ON approval_audit BEGIN SELECT RAISE(ABORT, 'append_only'); END;
    CREATE TRIGGER IF NOT EXISTS audit_no_delete BEFORE DELETE ON approval_audit BEGIN SELECT RAISE(ABORT, 'append_only'); END;
    CREATE TRIGGER IF NOT EXISTS package_immutable BEFORE UPDATE OF candidate_id, job_id, version, snapshot_json, digest ON application_packages
      BEGIN SELECT RAISE(ABORT, 'immutable_package'); END;
  `);
  const audit = (packageId: string | null, actor: string, action: string, detail = '') =>
    db.prepare('INSERT INTO approval_audit(package_id,actor,action,created_at,detail) VALUES (?,?,?,?,?)').run(packageId, actor, action, timestamp(), detail);
  function authenticated(req: express.Request, res: express.Response, role: 'candidate' | 'operator') {
    const token = role === 'candidate' ? opts.candidateToken : opts.botToken;
    const presented = req.header('authorization') || '';
    const configured = opts.botToken.length >= 32 && opts.candidateToken.length >= 32 && opts.candidateToken !== opts.botToken;
    if (!configured || !crypto.timingSafeEqual(Buffer.from(hash(presented)), Buffer.from(hash(`Bearer ${token}`)))) {
      audit(null, 'unauthenticated', 'access_denied', role);
      res.status(401).json({ ok: false, error: 'unauthorized' }); return false;
    }
    return true;
  }
  const get = (id: string) => db.prepare('SELECT * FROM application_packages WHERE id=?').get(id) as any;
  const current = (p: any) => !db.prepare('SELECT 1 FROM application_packages WHERE candidate_id=? AND job_id=? AND version>?').get(p.candidate_id, p.job_id, p.version);
  const valid = (p: any) => p && p.candidate_id === candidateId && hash(p.snapshot_json) === p.digest && current(p);
  const publicPackage = (p: any) => ({ ...p, snapshot_json: undefined, snapshot: JSON.parse(p.snapshot_json) });
  const schema = z.object({ candidateId: z.literal('maurice'), jobId: z.string().min(1), documentId: z.string().min(1), requisitionId: z.string().trim().min(1), toEmail: z.string().email(), subject: z.string().trim().min(5), text: z.string().trim().min(50) }).strict();
  const placeholder = /placeholder|\blorem ipsum\b|\bTODO\b|\bTBD\b|generated on-demand|\[insert|\{\{/i;
  const privateContent = /double offer os|job-hunter-bot|job-search-agent/i;
  app.get('/review', (_req, res) => {
    res.set('Cache-Control', 'no-store');
    res.set('Content-Security-Policy', "default-src 'none'; script-src 'sha256-" + crypto.createHash('sha256').update(reviewPage.script).digest('base64') + "'; style-src 'unsafe-inline'; connect-src 'self'; frame-src blob:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
    res.type('html').send(reviewPage.html);
  });
  app.get('/approval/packages', (req, res) => {
    if (!authenticated(req, res, 'candidate')) return;
    res.set('Cache-Control', 'no-store');
    const rows = db.prepare("SELECT id,version,state,created_at,digest,json_extract(snapshot_json,'$.company') AS company,json_extract(snapshot_json,'$.title') AS title FROM application_packages WHERE candidate_id=? ORDER BY created_at DESC LIMIT 200").all(candidateId);
    return res.json({ packages: rows, employerSendingEnabled: opts.allowEmployerSend === true });
  });
  app.post('/approval/packages', (req, res) => {
    if (!authenticated(req, res, 'operator')) return;
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) { audit(null, 'operator', 'invalid_package'); return res.status(400).json({ error: 'invalid_package' }); }
    try {
      const input = parsed.data;
      const job = db.prepare('SELECT * FROM jobs WHERE id=?').get(input.jobId) as any;
      const doc = db.prepare('SELECT * FROM documents WHERE id=? AND job_id=?').get(input.documentId, input.jobId) as any;
      if (!job || !doc || !job.company || !job.title) throw new Error('job_or_documents_missing');
      const attachments = [['resume', doc.resume_html_path, doc.resume_pdf_path], ['cover', doc.cover_html_path, doc.cover_pdf_path]].map(([kind, htmlPath, pdfPath]) => {
        const html = fs.readFileSync(htmlPath, 'utf8');
        const pdf = fs.readFileSync(pdfPath);
        if (privateContent.test(html)) throw new Error('private_employment_system_content');
        if (html.replace(/<[^>]*>/g, '').trim().length < 100 || placeholder.test(html) || pdf.length < 100 || !pdf.subarray(0, 5).equals(Buffer.from('%PDF-')) || placeholder.test(pdf.toString('latin1'))) throw new Error('placeholder_or_invalid_materials');
        return { filename: `Maurice_Thomas_${kind}.pdf`, contentBase64: pdf.toString('base64'), type: 'application/pdf', sourceHtml: html };
      });
      if (placeholder.test(input.text) || placeholder.test(input.subject)) throw new Error('placeholder_message');
      if (privateContent.test(input.text) || privateContent.test(input.subject)) throw new Error('private_employment_system_content');
      const snapshot = JSON.stringify({ ...input, company: job.company, title: job.title, sourceUrl: job.source_url, attachments });
      const p = db.transaction(() => {
        if (db.prepare("SELECT 1 FROM application_packages WHERE job_id=? AND state IN ('SENDING','SUBMISSION_UNCERTAIN','SUBMITTED')").get(input.jobId)) throw new Error('submission_already_attempted');
        if (db.prepare("SELECT 1 FROM application_packages WHERE candidate_id=? AND lower(trim(json_extract(snapshot_json, '$.company')))=? AND json_extract(snapshot_json, '$.requisitionId')=? AND state IN ('APPROVED','SENDING','SUBMISSION_UNCERTAIN','SUBMITTED') AND job_id<>?").get(candidateId, job.company.trim().toLowerCase(), input.requisitionId, input.jobId)) throw new Error('duplicate_requisition');
        const version = (db.prepare('SELECT COALESCE(MAX(version),0)+1 AS v FROM application_packages WHERE candidate_id=? AND job_id=?').get(candidateId, input.jobId) as any).v;
        const id = crypto.randomUUID();
        for (const previous of db.prepare("SELECT id FROM application_packages WHERE candidate_id=? AND job_id=? AND state IN ('PENDING','APPROVED')").all(candidateId, input.jobId) as any[]) audit(previous.id, 'operator', 'package_superseded', id);
        db.prepare("UPDATE application_packages SET state='SUPERSEDED' WHERE candidate_id=? AND job_id=? AND state IN ('PENDING','APPROVED')").run(candidateId, input.jobId);
        db.prepare('INSERT INTO application_packages(id,candidate_id,job_id,version,created_at,state,snapshot_json,digest) VALUES (?,?,?,?,?,?,?,?)').run(id, candidateId, input.jobId, version, timestamp(), 'PENDING', snapshot, hash(snapshot));
        audit(id, 'operator', 'package_created'); return get(id);
      }).immediate();
      return res.status(201).json({ ok: true, package: publicPackage(p) });
    } catch (e) { audit(null, 'operator', 'package_rejected'); return res.status(409).json({ error: (e as Error).message }); }
  });
  app.get('/approval/packages/:id', (req, res) => {
    if (!authenticated(req, res, 'candidate')) return;
    res.set('Cache-Control', 'no-store');
    const p = get(req.params.id);
    if (!p) return res.status(404).json({ error: 'not_found' });
    return res.json({ package: publicPackage(p), audit: db.prepare('SELECT * FROM approval_audit WHERE package_id=? ORDER BY id').all(p.id) });
  });
  app.post('/approval/packages/:id/decision', (req, res) => {
    if (!authenticated(req, res, 'candidate')) return;
    const p = get(req.params.id);
    if (!valid(p) || p.state !== 'PENDING' || req.body.digest !== p.digest || !['approve','reject'].includes(req.body.decision)) {
      audit(p?.id || null, candidateId, 'decision_denied'); return res.status(409).json({ error: 'invalid_or_stale_decision' });
    }
    const decided = db.transaction(() => {
      const fresh = get(p.id);
      if (!valid(fresh) || fresh.state !== 'PENDING') return false;
      const snapshot = JSON.parse(p.snapshot_json);
      if (req.body.decision === 'approve' && db.prepare("SELECT 1 FROM application_packages WHERE candidate_id=? AND lower(trim(json_extract(snapshot_json, '$.company')))=? AND json_extract(snapshot_json, '$.requisitionId')=? AND state IN ('APPROVED','SENDING','SUBMISSION_UNCERTAIN','SUBMITTED') AND id<>?").get(candidateId, snapshot.company.trim().toLowerCase(), snapshot.requisitionId, p.id)) {
        audit(p.id, candidateId, 'duplicate_approval_denied'); return false;
      }
      db.prepare('UPDATE application_packages SET state=? WHERE id=?').run(req.body.decision === 'approve' ? 'APPROVED' : 'REJECTED', p.id);
      audit(p.id, candidateId, req.body.decision, p.digest); return true;
    }).immediate();
    if (!decided) return res.status(409).json({ error: 'stale_or_duplicate_decision' });
    return res.json({ ok: true });
  });
  app.post('/approval/packages/:id/notify', async (req, res) => {
    if (!authenticated(req, res, 'operator')) return;
    const p = get(req.params.id);
    if (!valid(p) || p.state !== 'PENDING' || p.notified_at) return res.status(409).json({ error: 'valid_unnotified_pending_package_required' });
    let url: URL;
    try { url = new URL(opts.reviewUrl); if (url.protocol !== 'https:' || url.username || url.password) throw new Error(); }
    catch { return res.status(503).json({ error: 'HTTPS_candidate_review_URL_required' }); }
    // Claim before awaiting the provider. An ambiguous attempt requires reconciliation, never an automatic retry.
    const notified = db.transaction(() => {
      const fresh = get(p.id);
      if (!valid(fresh) || fresh.state !== 'PENDING' || fresh.notified_at) return false;
      db.prepare('UPDATE application_packages SET notified_at=? WHERE id=?').run(timestamp(), p.id);
      audit(p.id, 'operator', 'notification_attempted'); return true;
    }).immediate();
    if (!notified) return res.status(409).json({ error: 'notification_already_claimed_or_stale' });
    try {
      url.searchParams.set('packageId', p.id);
      await opts.send({ to: approvalEmail, subject: `Review application package v${p.version}`, text: `A pending application package is ready. Sign in as Maurice to review its full contents and approve or reject it: ${url.toString()}\nPackage digest: ${p.digest}\nThis email does not approve or submit an application.`, attachments: [] });
      audit(p.id, 'system', 'notification_provider_accepted'); return res.json({ ok: true });
    } catch { audit(p.id, 'system', 'notification_uncertain'); return res.status(502).json({ error: 'notification_uncertain_reconcile_before_retry' }); }
  });
  app.post('/apply/email', async (req, res) => {
    if (!authenticated(req, res, 'operator')) return;
    if (opts.allowEmployerSend !== true) {
      audit(null, 'operator', 'submission_disabled');
      return res.status(503).json({ error: 'employer_sending_disabled' });
    }
    const p = get(String(req.body.packageId || ''));
    // No request-supplied recipient, body or documents can override the approved snapshot.
    if (!valid(p) || p.state !== 'APPROVED' || Object.keys(req.body).some(k => k !== 'packageId')) {
      audit(p?.id || null, 'operator', 'submission_denied'); return res.status(403).json({ error: 'explicit_current_candidate_approval_required' });
    }
    const snapshot = JSON.parse(p.snapshot_json);
    const claimed = db.transaction(() => {
      const fresh = get(p.id);
      if (!valid(fresh) || fresh.state !== 'APPROVED') return false;
      const claim = db.prepare("UPDATE application_packages SET state='SENDING' WHERE id=? AND state='APPROVED'").run(p.id);
      if (claim.changes !== 1) return false;
      audit(p.id, 'operator', 'submission_attempted', p.digest); return true;
    }).immediate();
    if (!claimed) return res.status(403).json({ error: 'approval_already_claimed_or_stale' });
    try {
      await opts.send({ to: snapshot.toEmail, subject: snapshot.subject, text: snapshot.text, attachments: snapshot.attachments.map(({ sourceHtml, ...attachment }: any) => attachment) });
      db.prepare("UPDATE application_packages SET state='SUBMITTED' WHERE id=?").run(p.id);
      audit(p.id, 'system', 'submission_provider_accepted', 'Employer receipt not confirmed');
      return res.json({ ok: true, status: 'provider_accepted', employerConfirmed: false });
    } catch {
      db.prepare("UPDATE application_packages SET state='SUBMISSION_UNCERTAIN' WHERE id=?").run(p.id);
      audit(p.id, 'system', 'submission_uncertain'); return res.status(502).json({ error: 'submission_uncertain_reconcile_before_retry' });
    }
  });
  // A process interruption while sending cannot safely be retried.
  for (const p of db.prepare("SELECT id FROM application_packages WHERE state='SENDING'").all() as any[]) {
    db.prepare("UPDATE application_packages SET state='SUBMISSION_UNCERTAIN' WHERE id=?").run(p.id);
    audit(p.id, 'system', 'interrupted_submission_uncertain');
  }
}
