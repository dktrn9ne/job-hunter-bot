export function DocLinks(props: { jobId: string; base: "music" | "tech" | "marketing" }) {
  const { jobId, base } = props;
  const resumeHtmlKind = `resume_${base}.html`;
  const resumePdfKind = `resume_${base}.pdf`;

  const linkStyle: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: "9px",
    color: "var(--text-secondary)",
    textDecoration: "none",
    letterSpacing: "0.06em",
    opacity: 0.8,
    transition: "color 0.15s, opacity 0.15s",
    display: "inline-block",
  };

  const hoverIn = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.color = "var(--accent-cyan)";
    e.currentTarget.style.opacity = "1";
  };
  const hoverOut = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.color = "var(--text-secondary)";
    e.currentTarget.style.opacity = "0.8";
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
      {[
        { href: `/api/docs?jobId=${encodeURIComponent(jobId)}&kind=${encodeURIComponent(resumeHtmlKind)}`, label: "RES.HTML", target: "_blank" },
        { href: `/api/docs?jobId=${encodeURIComponent(jobId)}&kind=${encodeURIComponent(resumePdfKind)}`, label: "RES.PDF", target: "" },
        { href: `/api/docs?jobId=${encodeURIComponent(jobId)}&kind=cover.html`, label: "CVR.HTML", target: "_blank" },
        { href: `/api/docs?jobId=${encodeURIComponent(jobId)}&kind=cover.pdf`, label: "CVR.PDF", target: "" },
      ].map((link) => (
        <a
          key={link.label}
          href={link.href}
          target={link.target || undefined}
          rel={link.target === "_blank" ? "noreferrer" : undefined}
          style={linkStyle}
          onMouseEnter={hoverIn}
          onMouseLeave={hoverOut}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}
