import { IngestForm } from "./components/IngestForm";
import { TailorButton } from "./components/TailorButton";
import { DocLinks } from "./components/DocLinks";
import { botAuthHeaders, getBotApiConfig } from "./lib/botApi";

type Track = "TECH" | "MARKETING" | "PROCESS_TECH";
type BaseResume = "music" | "tech" | "marketing";

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
  track?: Track | null;
  base_resume?: BaseResume | null;
};

async function fetchJobs(): Promise<JobRow[]> {
  const config = getBotApiConfig();
  if ("error" in config) return [];

  const res = await fetch(`${config.base}/jobs`, {
    cache: "no-store",
    headers: botAuthHeaders(config.token),
  });

  if (!res.ok) return [];
  const json = await res.json();
  return json.jobs ?? [];
}

function statCount(jobs: JobRow[], statuses: string[]) {
  return jobs.filter((job) => statuses.includes(job.status)).length;
}

function avgScore(jobs: JobRow[]) {
  const scores = jobs
    .map((job) => job.match_score)
    .filter((score): score is number => typeof score === "number");

  if (scores.length === 0) return "-";
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function statusClass(status: string) {
  if (status === "APPLIED_EMAIL" || status === "APPLIED_WEB") return "tag-accent";
  if (status === "INTERVIEW" || status === "OFFER") return "tag-accent-2";
  if (status === "GENERATED" || status === "READY_TO_SUBMIT") return "tag-outline";
  return "tag-neutral";
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ").toLowerCase();
}

export default async function Home() {
  const jobs = await fetchJobs();
  const config = getBotApiConfig();
  const applied = statCount(jobs, ["APPLIED_EMAIL", "APPLIED_WEB"]);
  const interviews = statCount(jobs, ["INTERVIEW"]);

  return (
    <main>
      <nav className="nav" aria-label="Primary navigation">
        <span className="nav-brand">CAREER PIPELINE</span>
        <a href="#pipeline" aria-current="page">
          Pipeline
        </a>
        <a href="#ingest">Add</a>
        <a href="#roadmap">Roadmap</a>
        <span className="tag tag-outline bot-status">
          <span aria-hidden="true">*</span>
          {"base" in config ? "SERVICE ONLINE" : "SERVICE OFFLINE"}
        </span>
      </nav>

      <div className="page">
        <section className="stats-grid" aria-label="Pipeline statistics">
          <div className="stat-cell">
            <div className="stat-kicker">Total tracked</div>
            <div className="stat-num">{jobs.length}</div>
          </div>
          <div className="stat-cell">
            <div className="stat-kicker">Applied</div>
            <div className="stat-num accent-text">{applied}</div>
          </div>
          <div className="stat-cell">
            <div className="stat-kicker">Interviews</div>
            <div className="stat-num">{interviews}</div>
          </div>
          <div className="stat-cell">
            <div className="stat-kicker">Avg score</div>
            <div className="stat-num accent-text">{avgScore(jobs)}</div>
          </div>
        </section>

        <hr className="hr" />

        <section id="ingest" className="ingest-block" aria-labelledby="ingest-title">
          <div className="sec-title">
            <h1 id="ingest-title">Add opportunity</h1>
          </div>
          <IngestForm />
        </section>

        <hr className="hr" />

        <section id="pipeline" aria-labelledby="pipeline-title">
          <div className="sec-title">
            <h2 id="pipeline-title">Active pipeline</h2>
            <span className="count">{jobs.length} records</span>
          </div>

          <div className="job-list">
            {jobs.length === 0 ? (
              <div className="empty-state">
                <div className="card-title">No opportunities tracked yet</div>
                <p className="card-body">
                  Add a job description or posting URL above to start building the pipeline.
                </p>
              </div>
            ) : (
              jobs.map((job) => {
                const score = job.match_score ?? 0;
                const hasScore = typeof job.match_score === "number";

                return (
                  <article className="job-row" key={job.id}>
                    <div className="job-main">
                      <div className="job-role">{job.title ?? "Untitled role"}</div>
                      <div className="job-company">
                        {job.company ?? "Unknown company"}
                        {job.platform ? (
                          <>
                            {" "}
                            / <span className="tag tag-neutral">{job.platform}</span>
                          </>
                        ) : null}
                      </div>
                      {job.source_url ? (
                        <a href={job.source_url} target="_blank" rel="noreferrer">
                          VIEW POSTING
                        </a>
                      ) : null}
                    </div>

                    <div className="score-row" aria-label={`Match score ${score}`}>
                      <div className="score-bar">
                        <div
                          className={hasScore && score >= 75 ? "score-fill" : "score-fill muted"}
                          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                        />
                      </div>
                      <span
                        className={hasScore && score >= 75 ? "score-value strong" : "score-value"}
                      >
                        {hasScore ? score : "-"}
                      </span>
                    </div>

                    <div className={`tag ${statusClass(job.status)} status-badge`}>
                      {statusLabel(job.status)}
                    </div>

                    <div className="job-date">{formatDate(job.created_at)}</div>

                    <div className="job-actions">
                      <TailorButton
                        jobId={job.id}
                        base={job.base_resume ?? "marketing"}
                        track={job.track ?? undefined}
                      />
                      <DocLinks jobId={job.id} base={job.base_resume ?? "marketing"} />
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        <hr className="hr" />

        <section id="roadmap" aria-labelledby="roadmap-title">
          <div className="sec-title">
            <h2 id="roadmap-title">Next improvements</h2>
          </div>
          <div className="roadmap-grid">
            <div className="roadmap-cell">
              <div className="tag tag-outline">PLANNED</div>
              <div className="card-title">Smarter scoring</div>
              <p className="card-body">
                Structured keyword matching, must-have gating and role-specific weights.
              </p>
            </div>
            <div className="roadmap-cell">
              <div className="tag tag-outline">PLANNED</div>
              <div className="card-title">Status tracking</div>
              <p className="card-body">
                Interview scheduling, offer/rejection tracking and a pipeline analytics view.
              </p>
            </div>
            <div className="roadmap-cell">
              <div className="tag tag-outline">PLANNED</div>
              <div className="card-title">Cover letter templates</div>
              <p className="card-body">
                On-demand tailored generation using reusable candidate profile data.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
