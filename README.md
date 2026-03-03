# job-hunter-bot (v1)

Safe-by-default job hunter bot:
- Ingest job URLs/JDs
- Match-score (apply only if >= 75)
- Generate tailored resume + cover letter PDFs from HTML bases
- Auto-apply only for **apply-by-email** (SendGrid)
- Queue web-form applications for human review

## Local setup

### Requirements
- Node.js 18+ (22 ok)
- Google Chrome (for PDF generation)

### Configure
Copy `.env.example` to `.env` and fill values locally.

### Run
```bash
cd apps/bot
npm i
npm run dev
```

Bot API runs on `http://127.0.0.1:8787` by default.

## Notes
- Do not store secrets in git.
- Web-form auto-submission is intentionally NOT included in v1.
