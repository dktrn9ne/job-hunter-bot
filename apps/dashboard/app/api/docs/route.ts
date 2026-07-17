import { NextResponse } from "next/server";
import { botApiConfigError, botAuthHeaders, getBotApiConfig } from "../../lib/botApi";

function contentTypeFor(kind: string) {
  if (kind.endsWith(".pdf")) return "application/pdf";
  if (kind.endsWith(".html")) return "text/html; charset=utf-8";
  return "application/octet-stream";
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const jobId = url.searchParams.get("jobId");
  const kind = url.searchParams.get("kind");

  if (!jobId || !kind) {
    return NextResponse.json(
      { ok: false, error: "jobId_and_kind_required" },
      { status: 400 }
    );
  }

  const config = getBotApiConfig();
  if ("error" in config) return botApiConfigError(config.error);

  const target = `${config.base}/jobs/${jobId}/docs/${encodeURIComponent(kind)}`;

  const res = await fetch(target, {
    headers: botAuthHeaders(config.token),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return NextResponse.json(
      { ok: false, error: `bot_${res.status}`, detail: text.slice(0, 500) },
      { status: res.status }
    );
  }

  const buf = Buffer.from(await res.arrayBuffer());
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": contentTypeFor(kind),
      // for PDFs, suggest download when kind ends with .pdf
      ...(kind.endsWith(".pdf")
        ? { "Content-Disposition": `attachment; filename=\"${kind}\"` }
        : {}),
    },
  });
}
