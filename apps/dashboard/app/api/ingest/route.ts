import { NextResponse } from "next/server";
import { botApiConfigError, botAuthHeaders, getBotApiConfig } from "../../lib/botApi";

export async function POST(req: Request) {
  const body = await req.json();
  const config = getBotApiConfig();
  if ("error" in config) return botApiConfigError(config.error);

  const res = await fetch(`${config.base}/jobs/ingest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...botAuthHeaders(config.token),
    },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}
