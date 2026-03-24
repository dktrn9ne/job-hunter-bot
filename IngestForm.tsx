"use client";

import { useState } from "react";

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--bg-raised)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-sm)",
  padding: "9px 12px",
  fontFamily: "var(--font-mono)",
  fontSize: "12px",
  color: "var(--text-primary)",
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-mono)",
  fontSize: "9px",
  color: "var(--text-muted)",
  letterSpacing: "0.12em",
  marginBottom: "6px",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

export function IngestForm() {
  const [sourceUrl, setSourceUrl] = useState("");
  const [jdText, setJdText] = useState("");
  const [platform, setPlatform] = useState<"linkedin" | "indeed" | "ziprecruiter" | "upwork" | "other">("other");
  const [track, setTrack] = useState<"TECH" | "MARKETING" | "PROCESS_TECH">("MARKETING");
  const [baseResume, setBaseResume] = useState<"music" | "tech" | "marketing">("marketing");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const focusStyle = {
    borderColor: "var(--border-active)",
    boxShadow: "0 0 0 3px rgba(0, 212, 255, 0.06)",
  };

  const addFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = "var(--border-active)";
    e.target.style.boxShadow = "0 0 0 3px rgba(0, 212, 255, 0.06)";
  };
  const removeFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = "var(--border-subtle)";
    e.target.style.boxShadow = "none";
  };

  async function submit() {
    setBusy(true);
    setMsg(null);
    try {
      const payload: any = { platform, track, baseResume,
        company: company || undefined, title: title || undefined,
        location: location || undefined, sourceUrl: sourceUrl || undefined,
        jdText: jdText || undefined,
      };
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setMsg({ text: `Error: ${json?.error?.message ?? json?.error ?? res.status}`, ok: false });
      } else {
        setMsg({ text: `Ingested → ${json.jobId}`, ok: true });
        setSourceUrl(""); setJdText(""); setCompany(""); setTitle(""); setLocation("");
        setTimeout(() => window.location.reload(), 800);
      }
    } catch (e: any) {
      setMsg({ text: `Error: ${e?.message ?? String(e)}`, ok: false });
    } finally {
      setBusy(false);
    }
  }

  const selectStyle = { ...inputStyle, cursor: "pointer", appearance: "none" as const };

  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border-card)",
      borderRadius: "var(--radius-xl)",
      padding: "24px",
    }}>
      {/* Row 1: URL + Platform */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: "12px", marginBottom: "16px" }}>
        <Field label="JOB URL (OPTIONAL)">
          <input
            style={inputStyle}
            value={sourceUrl}
            onChange={e => setSourceUrl(e.target.value)}
            onFocus={addFocus} onBlur={removeFocus}
            placeholder="https://linkedin.com/jobs/..."
          />
        </Field>
        <Field label="PLATFORM">
          <select style={selectStyle} value={platform} onChange={e => setPlatform(e.target.value as any)} onFocus={addFocus} onBlur={removeFocus}>
            <option value="linkedin">LinkedIn</option>
            <option value="indeed">Indeed</option>
            <option value="ziprecruiter">ZipRecruiter</option>
            <option value="upwork">Upwork</option>
            <option value="other">Other</option>
          </select>
        </Field>
      </div>

      {/* Row 2: Company / Title / Location / Track / Resume */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 140px 140px", gap: "12px", marginBottom: "16px" }}>
        <Field label="COMPANY">
          <input style={inputStyle} value={company} onChange={e => setCompany(e.target.value)} onFocus={addFocus} onBlur={removeFocus} placeholder="Acme Corp" />
        </Field>
        <Field label="ROLE TITLE">
          <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} onFocus={addFocus} onBlur={removeFocus} placeholder="Marketing Manager" />
        </Field>
        <Field label="LOCATION">
          <input style={inputStyle} value={location} onChange={e => setLocation(e.target.value)} onFocus={addFocus} onBlur={removeFocus} placeholder="Austin, TX" />
        </Field>
        <Field label="TRACK">
          <select style={selectStyle} value={track} onChange={e => setTrack(e.target.value as any)} onFocus={addFocus} onBlur={removeFocus}>
            <option value="MARKETING">Marketing</option>
            <option value="TECH">Tech</option>
            <option value="PROCESS_TECH">Process Tech</option>
          </select>
        </Field>
        <Field label="BASE RESUME">
          <select style={selectStyle} value={baseResume} onChange={e => setBaseResume(e.target.value as any)} onFocus={addFocus} onBlur={removeFocus}>
            <option value="marketing">Marketing</option>
            <option value="tech">Tech</option>
            <option value="music">Music</option>
          </select>
        </Field>
      </div>

      {/* JD Text */}
      <div style={{ marginBottom: "16px" }}>
        <Field label="JOB DESCRIPTION (PASTE FULL TEXT — REQUIRED IF NO URL)">
          <textarea
            style={{
              ...inputStyle,
              minHeight: "120px",
              resize: "vertical",
              lineHeight: "1.6",
            }}
            value={jdText}
            onChange={e => setJdText(e.target.value)}
            onFocus={addFocus as any} onBlur={removeFocus as any}
            placeholder="Paste the complete job description here for best matching results..."
          />
        </Field>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", marginTop: "6px", letterSpacing: "0.06em" }}>
          ◌ REQUIRES URL OR JD TEXT ≥ 50 CHARS
        </div>
      </div>

      {/* Submit Row */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <button
          onClick={submit}
          disabled={busy}
          style={{
            background: busy ? "var(--bg-raised)" : "var(--accent-cyan)",
            color: busy ? "var(--text-muted)" : "var(--text-inverse)",
            border: "none",
            borderRadius: "var(--radius-sm)",
            padding: "10px 24px",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.1em",
            cursor: busy ? "not-allowed" : "pointer",
            transition: "all 0.15s",
            boxShadow: busy ? "none" : "var(--glow-cyan)",
          }}
          onMouseEnter={e => { if (!busy) (e.currentTarget.style.transform = "translateY(-1px)"); }}
          onMouseLeave={e => { (e.currentTarget.style.transform = "translateY(0)"); }}
        >
          {busy ? "INGESTING..." : "▸ INGEST TARGET"}
        </button>

        {msg && (
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: msg.ok ? "var(--accent-green)" : "var(--accent-red)",
            letterSpacing: "0.06em",
          }}>
            {msg.ok ? "✓" : "✗"} {msg.text}
          </div>
        )}
      </div>
    </div>
  );
}
