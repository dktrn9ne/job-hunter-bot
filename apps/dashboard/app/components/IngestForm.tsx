"use client";

import { useState } from "react";

export function IngestForm() {
  const [sourceUrl, setSourceUrl] = useState("");
  const [jdText, setJdText] = useState("");
  const [platform, setPlatform] = useState<
    "linkedin" | "indeed" | "ziprecruiter" | "upwork" | "other"
  >("other");

  const [track, setTrack] = useState<"TECH" | "MARKETING" | "PROCESS_TECH">(
    "MARKETING"
  );
  const [baseResume, setBaseResume] = useState<
    "music" | "tech" | "marketing"
  >("marketing");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setMsg(null);
    try {
      const payload: any = {
        platform,
        track,
        baseResume,
        company: company || undefined,
        title: title || undefined,
        location: location || undefined,
        sourceUrl: sourceUrl || undefined,
        jdText: jdText || undefined,
      };

      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setMsg(`Error: ${json?.error?.message ?? json?.error ?? res.status}`);
      } else {
        setMsg(`Added job: ${json.jobId}`);
        setSourceUrl("");
        setJdText("");
        setCompany("");
        setTitle("");
        setLocation("");
        // refresh page data
        window.location.reload();
      }
    } catch (e: any) {
      setMsg(`Error: ${e?.message ?? String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex flex-col md:flex-row md:items-end gap-3">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-zinc-700">
            Job URL (optional)
          </label>
          <input
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>
        <div className="w-full md:w-48">
          <label className="block text-xs font-semibold text-zinc-700">
            Platform
          </label>
          <select
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            value={platform}
            onChange={(e) => setPlatform(e.target.value as any)}
          >
            <option value="linkedin">LinkedIn</option>
            <option value="indeed">Indeed</option>
            <option value="ziprecruiter">ZipRecruiter</option>
            <option value="upwork">Upwork</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-3">
        <div>
          <label className="block text-xs font-semibold text-zinc-700">
            Company (optional)
          </label>
          <input
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-zinc-700">
            Title (optional)
          </label>
          <input
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-zinc-700">
            Location (optional)
          </label>
          <input
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-zinc-700">Track</label>
          <select
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            value={track}
            onChange={(e) => setTrack(e.target.value as any)}
          >
            <option value="MARKETING">Marketing</option>
            <option value="TECH">Tech</option>
            <option value="PROCESS_TECH">Process Tech</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-zinc-700">
            Base Resume
          </label>
          <select
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            value={baseResume}
            onChange={(e) => setBaseResume(e.target.value as any)}
          >
            <option value="marketing">Marketing</option>
            <option value="tech">Tech</option>
            <option value="music">Music</option>
          </select>
        </div>
      </div>

      <div className="mt-3">
        <label className="block text-xs font-semibold text-zinc-700">
          Job description (optional if URL provided)
        </label>
        <textarea
          className="mt-1 w-full rounded border px-3 py-2 text-sm min-h-[140px]"
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          placeholder="Paste the full job description here (recommended for LinkedIn/Upwork)."
        />
        <div className="mt-1 text-xs text-zinc-500">
          Requirement: either a URL or JD text (50+ chars). For LinkedIn/Upwork,
          paste the JD text.
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={submit}
          disabled={busy}
          className="rounded bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Adding…" : "Add Job"}
        </button>
        {msg ? <div className="text-sm text-zinc-700">{msg}</div> : null}
      </div>
    </div>
  );
}
