"use client";

import { useState } from "react";

export function TailorButton(props: {
  jobId: string;
  base: "music" | "tech" | "marketing";
  track?: "TECH" | "MARKETING" | "PROCESS_TECH";
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: props.jobId, base: props.base, track: props.track }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setMsg(`Error: ${json?.error ?? res.status}`);
      } else {
        setMsg("Tailored ✔");
        window.location.reload();
      }
    } catch (e: any) {
      setMsg(`Error: ${e?.message ?? String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={run}
        disabled={busy}
        className="rounded bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Tailoring…" : "Tailor"}
      </button>
      {msg ? <span className="text-xs text-zinc-600">{msg}</span> : null}
    </div>
  );
}
