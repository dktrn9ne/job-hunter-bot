"use client";

import { FormEvent, useState } from "react";

type Analysis = {
  score: number;
  verdict: "STRONG_MATCH" | "REVIEW" | "GAP";
  matchedTerms: string[];
  missingTerms: string[];
  risks: string[];
  summary: string;
  evidence: Array<{
    company: string;
    title: string;
    bullets: string[];
    source: { label: string; url: string; kind: "portfolio" | "repository" };
  }>;
  metadata: { analyzedAt: string; mode: string };
};

type FormState = {
  company: string;
  title: string;
  location: string;
  sourceUrl: string;
  jdText: string;
};

const EMPTY_FORM: FormState = { company: "", title: "", location: "", sourceUrl: "", jdText: "" };

function verdictLabel(verdict: Analysis["verdict"]) {
  if (verdict === "STRONG_MATCH") return "Strong evidence match";
  if (verdict === "REVIEW") return "Review before tailoring";
  return "Material gaps found";
}

function downloadAnalysis(analysis: Analysis, title: string) {
  const blob = new Blob([JSON.stringify({ title, analysis }, null, 2)], { type: "application/json" });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = `${title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "role"}-ats-analysis.json`;
  anchor.click();
  URL.revokeObjectURL(href);
}

export function AtsWorkspace() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function update(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Analysis failed");
      setAnalysis(payload.analysis);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Analysis failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="workspace" aria-label="ATS analysis workspace">
      <form className="analysis-form" onSubmit={submit}>
        <div className="section-heading">
          <div><span className="step">Step 1</span><h2>Describe the opportunity</h2></div>
          <span className="required-note">Job description required</span>
        </div>

        <div className="field-grid">
          <label><span>Company</span><input value={form.company} onChange={(event) => update("company", event.target.value)} placeholder="Company name" autoComplete="organization" /></label>
          <label><span>Role title</span><input value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="Senior Product Marketing Manager" required /></label>
          <label><span>Location</span><input value={form.location} onChange={(event) => update("location", event.target.value)} placeholder="Austin, TX or Remote" /></label>
          <label><span>Source URL</span><input type="url" value={form.sourceUrl} onChange={(event) => update("sourceUrl", event.target.value)} placeholder="https://…" /></label>
        </div>

        <label className="jd-label">
          <span>Full job description</span>
          <textarea value={form.jdText} onChange={(event) => update("jdText", event.target.value)} placeholder="Paste responsibilities, requirements, and preferred qualifications…" minLength={120} maxLength={50000} required />
          <small>{form.jdText.length.toLocaleString()} / 50,000 characters</small>
        </label>

        <div className="form-footer">
          <p>Your text is analyzed for this request and is not persisted in preview mode.</p>
          <button type="submit" disabled={busy || form.jdText.length < 120}>{busy ? "Analyzing…" : "Analyze fit"}</button>
        </div>
        {error ? <p className="error" role="alert">{error}</p> : null}
      </form>

      <section className={`results ${analysis ? "has-results" : ""}`} aria-live="polite">
        {analysis ? (
          <>
            <div className="score-card">
              <div className="score-ring" style={{ "--score": `${analysis.score * 3.6}deg` } as React.CSSProperties}><span>{analysis.score}</span><small>/ 100</small></div>
              <div><p className="eyebrow">ATS evidence score</p><h2>{verdictLabel(analysis.verdict)}</h2><p>{analysis.summary}</p></div>
            </div>

            <div className="result-grid">
              <article><h3>Verified matches</h3><div className="term-list matched">{analysis.matchedTerms.map((term) => <span key={term}>{term}</span>)}</div></article>
              <article><h3>Terms to review</h3><div className="term-list missing">{analysis.missingTerms.map((term) => <span key={term}>{term}</span>)}</div></article>
            </div>

            <article className="risk-card"><h3>Truth and qualification checks</h3><ul>{analysis.risks.map((risk) => <li key={risk}>{risk}</li>)}</ul></article>

            <div className="evidence-list">
              <div className="section-heading"><div><span className="step">Step 2</span><h2>Tailoring evidence</h2></div></div>
              {analysis.evidence.map((item) => (
                <article key={`${item.company}-${item.title}`}>
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.company}</span>
                    <a href={item.source.url} target="_blank" rel="noreferrer">
                      {item.source.kind === "repository" ? "Artifact evidence" : "Portfolio source"} ↗
                    </a>
                  </div>
                  <div>
                    <ul>{item.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
                    <small className={`source-note ${item.source.kind}`}>
                      {item.source.label}. Portfolio sources are candidate-authored; repository artifacts provide stronger implementation evidence.
                    </small>
                  </div>
                </article>
              ))}
            </div>

            <div className="result-actions">
              <button type="button" className="secondary" onClick={() => downloadAnalysis(analysis, form.title)}>Download analysis</button>
              <p>Human review is required before any résumé is finalized or application is submitted.</p>
            </div>
          </>
        ) : (
          <div className="results-empty"><span aria-hidden="true">◎</span><h2>Your fit analysis will appear here</h2><p>CheckChaser compares job language with verified skills, roles, and outcomes—then flags what it cannot prove.</p></div>
        )}
      </section>
    </section>
  );
}
