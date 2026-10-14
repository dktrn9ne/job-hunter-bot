# CheckChaser web application

This is the canonical Vercel application. It runs on Next.js route handlers and has no dependency on the legacy local Express tunnel.

### Commands

```bash
npm ci
npm run dev
npm run lint
npm test
npm run build
```

### API

- `POST /api/analyze` — validates a complete job description and returns deterministic evidence matches, missing terms, and hard-gate warnings
- `GET /api/health` — reports each capability independently; optional services are never reported ready solely because the web app loaded

The application intentionally has no send or apply endpoint. Outbound actions require durable identity, persistence, audit logs, and an explicit approval transition before they can be added.
