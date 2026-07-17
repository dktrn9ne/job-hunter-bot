export function DocLinks({
  jobId,
  base,
}: {
  jobId: string;
  base: "music" | "tech" | "marketing";
}) {
  const resumeHtmlKind = `resume_${base}.html`;
  const resumePdfKind = `resume_${base}.pdf`;

  return (
    <div className="doc-links">
      <a
        href={`/api/docs?jobId=${encodeURIComponent(jobId)}&kind=${encodeURIComponent(
          resumeHtmlKind
        )}`}
        target="_blank"
        rel="noreferrer"
      >
        RES.HTML
      </a>
      <a
        href={`/api/docs?jobId=${encodeURIComponent(jobId)}&kind=${encodeURIComponent(
          resumePdfKind
        )}`}
      >
        RES.PDF
      </a>
      <a
        href={`/api/docs?jobId=${encodeURIComponent(jobId)}&kind=cover.html`}
        target="_blank"
        rel="noreferrer"
      >
        CVR.HTML
      </a>
      <a href={`/api/docs?jobId=${encodeURIComponent(jobId)}&kind=cover.pdf`}>CVR.PDF</a>
    </div>
  );
}
