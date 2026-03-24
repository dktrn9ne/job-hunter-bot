import { IngestForm } from "./components/IngestForm";
import { TailorButton } from "./components/TailorButton";
import { DocLinks } from "./components/DocLinks";

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
  track?: "TECH" | "MARKETING" | "PROCESS_TECH" | null;
  base_resume?: "music" | "tech" | "marketing" | null;
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

function getStatusConfig(status: string) {
  const map: Record<string, { label: string; color: string; glow: string }> = {
    NEW: { label: "NEW", color: "var(--text-secondary)", glow: "none" },
    SCORED: { label: "SCORED", color: "var(--accent-cyan)", glow: "var(--glow-cyan)" },
    GENERATED: { label: "GENERATED", color: "var(--accent-purple)", glow: "none" },
    READY_TO_SUBMIT: { label: "READY", color: "var(--accent-gold)", glow: "var(--glow-gold)" },
    APPLIED_EMAIL: { label: "APPLIED", color: "var(--accent-green)", glow: "none" },
    APPLIED_WEB: { label: "WEB APPLIED", color: "var(--accent-green)", glow: "none" },
    INTERVIEW: { label: "INTERVIEW", color: "#ff9f0a", glow: "none" },
    OFFER: { label: "OFFER 🔥", color: "var(--accent-gold)", glow: "var(--glow-gold)" },
    REJECTED: { label: "REJECTED", color: "var(--accent-red)", glow: "none" },
  };
  return map[status] ?? { label: status, color: "var(--text-muted)", glow: "none" };
}

function ScoreBar({ score }: { score: number | null }) {
  if (score === null) return <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>—</span>;
  const pass = score >= 75;
  const color = score >= 75 ? "var(--accent-green)" : score >= 50 ? "var(--accent-gold)" : "var(--accent-red)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: "90px" }}>
      <div style={{ flex: 1, height: "3px", background: "var(--bg-raised)", borderRadius: "2px", overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${score}%`,
          background: color,
          transition: "width 0.6s ease",
          boxShadow: pass ? `0 0 8px ${color}` : "none",
        }} />
      </div>
      <span style={{
        fontFamily: "var(--font-mono)",
        fontSize: "11px",
        color,
        fontWeight: 600,
        minWidth: "28px",
        textAlign: "right",
      }}>{score}</span>
    </div>
  );
}

export default async function Home() {
  const jobs = await fetchJobs();
  const apiUrl = process.env.NEXT_PUBLIC_BOT_API_URL;

  const statsByStatus = jobs.reduce((acc, j) => {
    acc[j.status] = (acc[j.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const applied = (statsByStatus["APPLIED_EMAIL"] ?? 0) + (statsByStatus["APPLIED_WEB"] ?? 0);
  const interviews = statsByStatus["INTERVIEW"] ?? 0;
  const offers = statsByStatus["OFFER"] ?? 0;
  const avgScore = jobs.filter(j => j.match_score !== null).reduce((s, j, _, a) => s + (j.match_score! / a.length), 0);

  return (
    <div style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>

      {/* ── HEADER ── */}
      <header style={{
        borderBottom: "1px solid var(--border-subtle)",
        padding: "0 32px",
        height: "56px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backdropFilter: "blur(12px)",
        background: "rgba(2, 4, 8, 0.8)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{
            width: "28px", height: "28px",
            background: "var(--accent-cyan)",
            borderRadius: "6px",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "var(--glow-cyan)",
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" fill="var(--text-inverse)" stroke="none"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "15px", color: "var(--text-primary)", letterSpacing: "0.05em" }}>
              JOB HUNTER
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.12em", marginTop: "-2px" }}>
              COMMAND CENTER v1
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {apiUrl ? (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent-green)", boxShadow: "0 0 6px var(--accent-green)", animation: "pulse 2s ease-in-out infinite" }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-secondary)", letterSpacing: "0.08em" }}>
                BOT ONLINE
              </span>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent-red)" }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--accent-red)", letterSpacing: "0.08em" }}>
                BOT OFFLINE — SET ENV
              </span>
            </div>
          )}

          <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.06em" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase()}
          </div>
        </div>
      </header>

      <main style={{ padding: "32px", maxWidth: "1400px", margin: "0 auto" }}>

        {/* ── STATS ROW ── */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
          {[
            { label: "TOTAL TRACKED", value: jobs.length, accent: "var(--accent-cyan)", sub: "all time" },
            { label: "APPLIED", value: applied, accent: "var(--accent-green)", sub: "email + web" },
            { label: "INTERVIEWS", value: interviews, accent: "var(--accent-gold)", sub: "in pipeline" },
            { label: "AVG SCORE", value: jobs.length ? `${Math.round(avgScore)}` : "—", accent: avgScore >= 75 ? "var(--accent-green)" : avgScore >= 50 ? "var(--accent-gold)" : "var(--accent-red)", sub: "match quality" },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              borderRadius: "var(--radius-lg)",
              padding: "20px 24px",
              position: "relative",
              overflow: "hidden",
              transition: "border-color 0.2s",
            }}>
              <div style={{
                position: "absolute", top: 0, left: 0,
                width: "3px", height: "100%",
                background: stat.accent,
                boxShadow: `0 0 12px ${stat.accent}`,
              }} />
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.12em", marginBottom: "8px" }}>
                {stat.label}
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "36px", fontWeight: 800, color: stat.accent, lineHeight: 1 }}>
                {stat.value}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>
                {stat.sub}
              </div>
            </div>
          ))}
        </section>

        {/* ── INGEST FORM ── */}
        <section style={{ marginBottom: "32px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px",
          }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--accent-cyan)", letterSpacing: "0.14em" }}>
              ▸ INGEST NEW TARGET
            </div>
            <div style={{ flex: 1, height: "1px", background: "var(--border-subtle)" }} />
          </div>
          <IngestForm />
        </section>

        {/* ── JOBS TABLE ── */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--accent-cyan)", letterSpacing: "0.14em" }}>
              ▸ ACTIVE PIPELINE — {jobs.length} RECORDS
            </div>
            <div style={{ flex: 1, height: "1px", background: "var(--border-subtle)" }} />
          </div>

          <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-card)",
            borderRadius: "var(--radius-xl)",
            overflow: "hidden",
          }}>
            {/* Table header */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "180px 1fr 120px 100px 130px 160px 200px",
              padding: "10px 20px",
              borderBottom: "1px solid var(--border-subtle)",
              background: "var(--bg-surface)",
            }}>
              {["COMPANY", "ROLE", "PLATFORM", "SCORE", "STATUS", "INGESTED", "ACTIONS"].map((h) => (
                <div key={h} style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "9px",
                  color: "var(--text-muted)",
                  letterSpacing: "0.12em",
                  fontWeight: 600,
                }}>{h}</div>
              ))}
            </div>

            {/* Rows */}
            {jobs.length === 0 ? (
              <div style={{ padding: "60px 20px", textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                  NO JOBS INGESTED YET — ADD YOUR FIRST TARGET ABOVE
                </div>
              </div>
            ) : (
              jobs.map((j, idx) => {
                const statusCfg = getStatusConfig(j.status);
                return (
                  <div key={j.id} style={{
                    display: "grid",
                    gridTemplateColumns: "180px 1fr 120px 100px 130px 160px 200px",
                    padding: "14px 20px",
                    borderBottom: idx < jobs.length - 1 ? "1px solid var(--border-subtle)" : "none",
                    alignItems: "center",
                    transition: "background 0.15s",
                    cursor: "default",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* Company */}
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-primary)", fontWeight: 500, paddingRight: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {j.company ?? <span style={{ color: "var(--text-muted)" }}>—</span>}
                    </div>

                    {/* Role */}
                    <div style={{ paddingRight: "12px" }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {j.title ?? <span style={{ color: "var(--text-muted)" }}>Unknown Role</span>}
                      </div>
                      {j.source_url && (
                        <a href={j.source_url} target="_blank" rel="noreferrer"
                          style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--accent-cyan)", letterSpacing: "0.06em", textDecoration: "none", opacity: 0.7 }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                          onMouseLeave={e => (e.currentTarget.style.opacity = "0.7")}
                        >
                          VIEW POSTING ↗
                        </a>
                      )}
                    </div>

                    {/* Platform */}
                    <div>
                      <span style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "9px",
                        letterSpacing: "0.1em",
                        color: "var(--text-secondary)",
                        background: "var(--bg-raised)",
                        padding: "2px 8px",
                        borderRadius: "3px",
                        border: "1px solid var(--border-card)",
                        textTransform: "uppercase",
                      }}>
                        {j.platform ?? "other"}
                      </span>
                    </div>

                    {/* Score */}
                    <div>
                      <ScoreBar score={j.match_score ?? null} />
                    </div>

                    {/* Status */}
                    <div>
                      <span style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "9px",
                        letterSpacing: "0.1em",
                        color: statusCfg.color,
                        fontWeight: 600,
                        textShadow: statusCfg.glow !== "none" ? statusCfg.glow : "none",
                      }}>
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* Date */}
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>
                      {new Date(j.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <TailorButton
                        jobId={j.id}
                        base={(j.base_resume ?? "marketing") as any}
                        track={(j.track ?? undefined) as any}
                      />
                      <DocLinks jobId={j.id} base={(j.base_resume ?? "marketing") as any} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* ── ROADMAP ── */}
        <section style={{ marginTop: "40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.14em" }}>
              ▸ NEXT IMPROVEMENTS
            </div>
            <div style={{ flex: 1, height: "1px", background: "var(--border-subtle)" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            {[
              { label: "ATS Scoring v2", desc: "Structured keyword matching + must-have gating + track weights", status: "PLANNED" },
              { label: "Status Tracking", desc: "Interview scheduling, offer/rejection tracking, pipeline analytics", status: "PLANNED" },
              { label: "Cover Letter v2", desc: "On-demand tailored generation via AI fact-bank pipeline", status: "PLANNED" },
            ].map((item) => (
              <div key={item.label} style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-card)",
                borderRadius: "var(--radius-md)",
                padding: "16px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-primary)", fontWeight: 600 }}>{item.label}</div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "8px", color: "var(--text-muted)", letterSpacing: "0.1em", background: "var(--bg-raised)", padding: "2px 6px", borderRadius: "2px" }}>{item.status}</span>
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </section>

      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
