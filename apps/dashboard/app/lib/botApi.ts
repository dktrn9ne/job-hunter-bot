import { NextResponse } from "next/server";

type BotApiConfig =
  | { base: string; token: string }
  | { error: "BOT_API_URL_missing" | "BOT_API_TOKEN_missing" };

export function getBotApiConfig(): BotApiConfig {
  const base = process.env.BOT_API_URL || process.env.NEXT_PUBLIC_BOT_API_URL;
  const token = process.env.BOT_API_TOKEN || process.env.NEXT_PUBLIC_BOT_API_TOKEN;

  if (!base) {
    return { error: "BOT_API_URL_missing" as const };
  }
  if (!token) {
    return { error: "BOT_API_TOKEN_missing" as const };
  }

  return {
    base: base.replace(/\/$/, ""),
    token,
  };
}

export function botApiConfigError(error: string) {
  return NextResponse.json({ ok: false, error }, { status: 500 });
}

export function botAuthHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}
