import { NextResponse } from "next/server";

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

  const botBase = process.env.NEXT_PUBLIC_BOT_API_URL;
  const token = process.env.NEXT_PUBLIC_BOT_API_TOKEN;

  if (!botBase) {
    return NextResponse.json(
      { ok: false, error: "NEXT_PUBLIC_BOT_API_URL_missing" },
      { status: 500 }
    );
  }
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "NEXT_PUBLIC_BOT_API_TOKEN_missing" },
      { status: 500 }
    );
  }

  const target = `${botBase.replace(/\/$/, "")}/jobs/${jobId}/docs/${encodeURIComponent(
    kind
  )}`;

  const res = await fetch(target, {
    headers: { Authorization: `Bearer ${token}` },
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
