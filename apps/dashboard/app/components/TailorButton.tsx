"use client";

import { useState } from "react";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function TailorButton({
  jobId,
  base,
  track,
}: {
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
        body: JSON.stringify({ jobId, base, track }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setMsg(`Error: ${json?.error ?? res.status}`);
      } else {
        setMsg("Tailored");
        window.location.reload();
      }
    } catch (e: unknown) {
      setMsg(`Error: ${errorMessage(e)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="tailor-control">
      <button onClick={run} disabled={busy} className="btn btn-secondary tailor-btn">
        {busy ? "TAILORING..." : "TAILOR"}
      </button>
      {msg ? <span className="tailor-message">{msg}</span> : null}
    </div>
  );
}
