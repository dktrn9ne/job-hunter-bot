import { IngestForm } from "./components/IngestForm";

type JobRow = {
  id: string;
  created_at: string;
  source_url?: string | null;
  platform?: string | null;
  company?: string | null;
  title?: string | null;
  location?: string | null;
  match_score?: number | null;
  status: string;
  match_reason?: string | null;
};

async function fetchJobs(): Promise<JobRow[]> {
  const base = process.env.NEXT_PUBLIC_BOT_API_URL;
  if (!base) return [];

  const res = await fetch(`${base.replace(/\/$/, "")}/jobs`, {
    cache: "no-store",
    headers: process.env.NEXT_PUBLIC_BOT_API_TOKEN
      ? { Authorization: `Bearer ${process.env.NEXT_PUBLIC_BOT_API_TOKEN}` }
      : undefined,
  });

  if (!res.ok) return [];
  const json = await res.json();
  return json.jobs ?? [];
}

export default async function Home() {
  const jobs = await fetchJobs();

  return (
    <div className="min-h-screen bg-zinc-50 p-6 font-sans text-zinc-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Job Hunter Dashboard</h1>
            <p className="text-sm text-zinc-600">
              Applied / interviews / yays / nays (v1)
            </p>
          </div>
          <div className="text-sm text-zinc-600">
            {process.env.NEXT_PUBLIC_BOT_API_URL ? (
              <span>Bot API: {process.env.NEXT_PUBLIC_BOT_API_URL}</span>
            ) : (
              <span className="font-semibold text-red-600">
                Set NEXT_PUBLIC_BOT_API_URL in Vercel env
              </span>
            )}
          </div>
        </div>

        <div className="mb-6">
          <IngestForm />
        </div>

        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50">
              <tr className="text-left">
                <th className="p-3">Company</th>
                <th className="p-3">Title</th>
                <th className="p-3">Platform</th>
                <th className="p-3">Score</th>
                <th className="p-3">Status</th>
                <th className="p-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr>
                  <td className="p-3 text-zinc-600" colSpan={6}>
                    No jobs yet (or dashboard can’t reach the bot API).
                  </td>
                </tr>
              ) : (
                jobs.map((j) => (
                  <tr key={j.id} className="border-t">
                    <td className="p-3 whitespace-nowrap">{j.company ?? "—"}</td>
                    <td className="p-3 min-w-[360px]">
                      <div className="font-medium">{j.title ?? "—"}</div>
                      {j.source_url ? (
                        <a
                          className="text-blue-600 hover:underline"
                          href={j.source_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View posting
                        </a>
                      ) : null}
                    </td>
                    <td className="p-3 whitespace-nowrap">{j.platform ?? "—"}</td>
                    <td className="p-3 whitespace-nowrap">{j.match_score ?? "—"}</td>
                    <td className="p-3 whitespace-nowrap">{j.status}</td>
                    <td className="p-3 whitespace-nowrap">
                      {new Date(j.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 text-sm text-zinc-600">
          <div className="font-semibold">Next improvements</div>
          <ul className="list-disc pl-5">
            <li>
              ATS scoring v2: structured keyword matching + must-have gating +
              track-specific weights
            </li>
            <li>Auth token on bot API endpoints</li>
            <li>Status updates + interview scheduling + yays/nays</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
