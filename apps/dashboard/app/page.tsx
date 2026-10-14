import { AtsWorkspace } from "./components/AtsWorkspace";

export default function Home() {
  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="CheckChaser home">
          <span className="brand-mark" aria-hidden="true">CC</span>
          <span>CheckChaser</span>
        </a>
        <div className="status-chip">
          <span className="status-dot" aria-hidden="true" />
          Private preview
        </div>
      </header>

      <div className="shell" id="top">
        <section className="hero" aria-labelledby="page-title">
          <p className="eyebrow">Evidence-based application workspace</p>
          <h1 id="page-title">Know the fit before you rewrite the résumé.</h1>
          <p className="hero-copy">
            Paste a complete job description. CheckChaser maps its requirements to verified
            experience, surfaces gaps, and prepares a truthful tailoring brief.
          </p>
          <div className="trust-row" aria-label="Safety guarantees">
            <span>Verified facts only</span>
            <span>No automatic applications</span>
            <span>No email sent</span>
          </div>
        </section>

        <AtsWorkspace />

        <section className="architecture" aria-labelledby="readiness-title">
          <div>
            <p className="eyebrow">Deployment readiness</p>
            <h2 id="readiness-title">Safe by default.</h2>
          </div>
          <div className="readiness-grid">
            <article><strong>01</strong><h3>Server-side analysis</h3><p>Candidate evidence never enters the browser bundle.</p></article>
            <article><strong>02</strong><h3>Explicit approval</h3><p>Generating a brief cannot submit an application or contact anyone.</p></article>
            <article><strong>03</strong><h3>Honest capability</h3><p>Health checks distinguish working analysis from unconfigured storage and workflows.</p></article>
          </div>
        </section>
      </div>
    </main>
  );
}
