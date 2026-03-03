export function DocLinks(props: { jobId: string; base: "music" | "tech" | "marketing" }) {
  const { jobId, base } = props;
  const resumeHtmlKind = `resume_${base}.html`;
  const resumePdfKind = `resume_${base}.pdf`;

  return (
    <div className="flex flex-col gap-1 text-xs">
      <a
        className="text-blue-600 hover:underline"
        href={`/api/docs?jobId=${encodeURIComponent(jobId)}&kind=${encodeURIComponent(
          resumeHtmlKind
        )}`}
        target="_blank"
        rel="noreferrer"
      >
        View resume (HTML)
      </a>
      <a
        className="text-blue-600 hover:underline"
        href={`/api/docs?jobId=${encodeURIComponent(jobId)}&kind=${encodeURIComponent(
          resumePdfKind
        )}`}
      >
        Download resume (PDF)
      </a>
      <a
        className="text-blue-600 hover:underline"
        href={`/api/docs?jobId=${encodeURIComponent(jobId)}&kind=cover.html`}
        target="_blank"
        rel="noreferrer"
      >
        View cover (HTML)
      </a>
      <a
        className="text-blue-600 hover:underline"
        href={`/api/docs?jobId=${encodeURIComponent(jobId)}&kind=cover.pdf`}
      >
        Download cover (PDF)
      </a>
    </div>
  );
}
