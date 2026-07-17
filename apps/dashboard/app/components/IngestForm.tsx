"use client";

import { useState } from "react";

type Platform = "linkedin" | "indeed" | "ziprecruiter" | "upwork" | "other";
type Track = "TECH" | "MARKETING" | "PROCESS_TECH";
type BaseResume = "music" | "tech" | "marketing";

type IngestPayload = {
  platform: Platform;
  track: Track;
  baseResume: BaseResume;
  company?: string;
  title?: string;
  location?: string;
  sourceUrl?: string;
  jdText?: string;
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function IngestForm() {
  const [sourceUrl, setSourceUrl] = useState("");
  const [jdText, setJdText] = useState("");
  const [platform, setPlatform] = useState<Platform>("other");
  const [track, setTrack] = useState<Track>("MARKETING");
  const [baseResume, setBaseResume] = useState<BaseResume>("marketing");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setMsg(null);
    try {
      const payload: IngestPayload = {
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
        window.location.reload();
      }
    } catch (e: unknown) {
      setMsg(`Error: ${errorMessage(e)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="form-grid form-row-2">
        <div className="field">
          <label htmlFor="job-url">JOB URL (OPTIONAL)</label>
          <input
            id="job-url"
            className="input"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://linkedin.com/jobs/..."
          />
        </div>
        <div className="field">
          <label htmlFor="platform">PLATFORM</label>
          <select
            id="platform"
            className="input"
            value={platform}
            onChange={(e) => setPlatform(e.target.value as Platform)}
          >
            <option value="linkedin">LinkedIn</option>
            <option value="indeed">Indeed</option>
            <option value="ziprecruiter">ZipRecruiter</option>
            <option value="upwork">Upwork</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="form-grid form-row-5">
        <div className="field">
          <label htmlFor="company">COMPANY</label>
          <input
            id="company"
            className="input"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company name"
          />
        </div>
        <div className="field">
          <label htmlFor="title">ROLE TITLE</label>
          <input
            id="title"
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Product Manager"
          />
        </div>
        <div className="field">
          <label htmlFor="location">LOCATION</label>
          <input
            id="location"
            className="input"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Remote, New York, NY"
          />
        </div>
        <div className="field">
          <label htmlFor="track">TRACK</label>
          <select
            id="track"
            className="input"
            value={track}
            onChange={(e) => setTrack(e.target.value as Track)}
          >
            <option value="MARKETING">Business / Growth</option>
            <option value="TECH">Technical</option>
            <option value="PROCESS_TECH">Operations</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="base-resume">RESUME PROFILE</label>
          <select
            id="base-resume"
            className="input"
            value={baseResume}
            onChange={(e) => setBaseResume(e.target.value as BaseResume)}
          >
            <option value="marketing">General</option>
            <option value="tech">Technical</option>
            <option value="music">Creative</option>
          </select>
        </div>
      </div>

      <div className="field jd-field">
        <label htmlFor="job-description">JOB DESCRIPTION (PASTE FULL TEXT - REQUIRED IF NO URL)</label>
        <textarea
          id="job-description"
          className="input"
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          placeholder="Paste the complete job description here for best matching results..."
        />
      </div>

      <div className="form-actions">
        <button onClick={submit} disabled={busy} className="btn btn-primary">
          {busy ? "Adding..." : "Add opportunity"}
        </button>
        {msg ? <div className="form-message">{msg}</div> : null}
      </div>
    </div>
  );
}
