# CheckChaser

CheckChaser is a private, evidence-based workspace for evaluating job fit and preparing truthful resume-tailoring briefs.

## Current architecture

- `apps/dashboard` — canonical Next.js 16 application for Vercel
- `apps/bot` — legacy local Express service retained for migration reference; it is not used by the Vercel application
- `facts` — verified candidate source material; server-side use only
- `policies` — application safety and approval rules

The Vercel application performs deterministic ATS analysis in a Node.js route handler. It does not submit applications, send email, or claim that unconfigured services are online. In preview mode, job descriptions and results are not persisted.

Evidence records include provenance. Public repositories and reproducible CI artifacts are labeled as implementation evidence; `mauricethomas.online` is labeled as a candidate-authored portfolio source and does not independently prove employment, awards, adoption metrics, or third-party recognition.

## Local validation

```bash
cd apps/dashboard
npm ci
npm run lint
npm test
npm run build
```

Use Node.js 24, matching the Vercel project runtime.

## Environment variables

Copy `.env.example` to `.env.local` only when enabling an integration. Never use `NEXT_PUBLIC_` for credentials.

- `DATABASE_URL` — durable application and approval records
- `BLOB_READ_WRITE_TOKEN` — generated document storage
- `CHECKCHASER_APPROVAL_SECRET` — server-side approval verification
- `CRON_SECRET` — authenticated scheduled maintenance
- `SENDGRID_API_KEY`, `MAIL_FROM`, `MAIL_FROM_NAME` — optional outbound email after approval

## Deployment policy

1. Deploy changes to a preview branch.
2. Validate the UI, `/api/health`, and `/api/analyze`.
3. Require human review of generated evidence and qualification warnings.
4. Provision database, Blob, auth, and durable workflows before enabling persistence or document generation.
5. Never promote a preview to production without explicit approval.

## Security note

The repository previously contained a committed API token placeholder that resembled a live secret. Rotate any credential that may have used that value and keep the repository private because verified candidate records contain personal data.

## Evidence context contract

Read `context/domain_rules.md` and `context/table_guide.md` before running the policy workflow. Mandatory qualifications need requirement-to-proof records; unknowns stay in review. Deterministic checks validate structure, not source truth or model accuracy.
