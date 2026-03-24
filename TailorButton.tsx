"use client";

import { useState } from "react";

export function TailorButton(props: {
  jobId: string;
  base: "music" | "tech" | "marketing";
  track?: "TECH" | "MARKETING" | "PROCESS_TECH";
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

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
        setMsg({ text: `ERR: ${json?.error ?? res.status}`, ok: false });
      } else {
        setMsg({ text: "TAILORED", ok: true });
        setTimeout(() => window.location.reload(), 600);
      }
    } catch (e: any) {
      setMsg({ text: `ERR: ${e?.message ?? String(e)}`, ok: false });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <button
        onClick={run}
        disabled={busy}
        style={{
          background: "transparent",
          border: `1px solid ${busy ? "var(--border-subtle)" : "var(--border-active)"}`,
          borderRadius: "var(--radius-sm)",
          padding: "5px 12px",
          fontFamily: "var(--font-mono)",
          fontSize: "9px",
          fontWeight: 600,
          letterSpacing: "0.1em",
          color: busy ? "var(--text-muted)" : "var(--accent-cyan)",
          cursor: busy ? "not-allowed" : "pointer",
          transition: "all 0.15s",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={e => { if (!busy) { e.currentTarget.style.background = "var(--accent-cyan-dim)"; e.currentTarget.style.boxShadow = "var(--glow-cyan)"; }}}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.boxShadow = "none"; }}
      >
        {busy ? "TAILORING..." : "▸ TAILOR"}
      </button>
      {msg && (
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "9px",
          color: msg.ok ? "var(--accent-green)" : "var(--accent-red)",
          letterSpacing: "0.08em",
        }}>
          {msg.ok ? "✓" : "✗"} {msg.text}
        </span>
      )}
    </div>
  );
}
