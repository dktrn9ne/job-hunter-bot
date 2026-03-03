import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
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

  const { jobId, ...rest } = body;
  if (!jobId) {
    return NextResponse.json({ ok: false, error: "jobId_required" }, { status: 400 });
  }

  const res = await fetch(`${botBase.replace(/\/$/, "")}/jobs/${jobId}/tailor`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(rest),
  });

  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}
