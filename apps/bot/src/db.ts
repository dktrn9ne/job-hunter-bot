import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

export type JobStatus =
  | 'NEW'
  | 'SCORED'
  | 'GENERATED'
  | 'READY_TO_SUBMIT'
  | 'APPLIED_EMAIL'
  | 'APPLIED_WEB'
  | 'INTERVIEW'
  | 'OFFER'
  | 'REJECTED';

export function openDb(dataDir: string) {
  fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = path.join(dataDir, 'jobs.sqlite');
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      source_url TEXT,
      platform TEXT,
      company TEXT,
      title TEXT,
      location TEXT,
      jd_text TEXT,
      match_score INTEGER,
      match_reason TEXT,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      base_resume TEXT NOT NULL,
      resume_html_path TEXT NOT NULL,
      resume_pdf_path TEXT NOT NULL,
      cover_html_path TEXT NOT NULL,
      cover_pdf_path TEXT NOT NULL,
      FOREIGN KEY(job_id) REFERENCES jobs(id)
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      type TEXT NOT NULL,
      payload_json TEXT,
      FOREIGN KEY(job_id) REFERENCES jobs(id)
    );
  `);

  return db;
}
