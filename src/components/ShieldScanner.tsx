"use client";

import { useState } from "react";
import type { ShieldScanResult, ShieldUrlResult } from "@/lib/shield/types";

const RISK_STYLES = {
  safe: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-300",
    badge: "bg-emerald-600 text-white",
    label: "Likely safe",
  },
  suspicious: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-300",
    badge: "bg-amber-600 text-white",
    label: "Suspicious",
  },
  dangerous: {
    bg: "bg-red-500/10",
    border: "border-red-500/35",
    text: "text-red-300",
    badge: "bg-red-600 text-white",
    label: "Dangerous",
  },
} as const;

function RiskBadge({ risk }: { risk: keyof typeof RISK_STYLES }) {
  const s = RISK_STYLES[risk];
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${s.badge}`}
    >
      {s.label}
    </span>
  );
}

function UrlResultCard({
  result,
  onReport,
}: {
  result: ShieldUrlResult;
  onReport?: (url: string) => void;
}) {
  const s = RISK_STYLES[result.risk];
  return (
    <article className={`rounded-2xl border p-5 ${s.bg} ${s.border}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-sm text-zinc-500">
            {result.normalizedUrl}
          </p>
          <p className="mt-1 font-semibold text-white">
            {result.domain || "Unknown domain"}
          </p>
        </div>
        <RiskBadge risk={result.risk} />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all ${
              result.risk === "dangerous"
                ? "bg-red-500"
                : result.risk === "suspicious"
                  ? "bg-amber-500"
                  : "bg-emerald-500"
            }`}
            style={{ width: `${result.score}%` }}
          />
        </div>
        <span className={`text-sm font-medium ${s.text}`}>
          {result.score}/100
        </span>
      </div>
      {result.flags.length > 0 && (
        <ul className="mt-4 space-y-2">
          {result.flags.map((flag) => (
            <li
              key={flag.id}
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
            >
              <p className="font-medium text-zinc-100">{flag.title}</p>
              <p className="mt-0.5 text-zinc-500">{flag.detail}</p>
            </li>
          ))}
        </ul>
      )}
      {result.risk !== "safe" && onReport && (
        <button
          type="button"
          onClick={() => onReport(result.normalizedUrl || result.url)}
          className="mt-4 text-sm font-semibold text-red-400 underline-offset-2 hover:underline"
        >
          Report as scam (protect community)
        </button>
      )}
    </article>
  );
}

export default function ShieldScanner() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ShieldScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reportMsg, setReportMsg] = useState<string | null>(null);

  async function handleReport(url: string) {
    setReportMsg(null);
    try {
      const res = await fetch("/api/shield/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, note: "Reported from scanner" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Report failed");
      setReportMsg(data.message);
    } catch (err) {
      setReportMsg(err instanceof Error ? err.message : "Report failed");
    }
  }

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/shield/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Scan failed");
      }
      setResult(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const overall = result ? RISK_STYLES[result.overallRisk] : null;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <form onSubmit={handleScan} className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-zinc-400">
            Paste a link or full message
          </span>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="https://paypa1-secure-login.xyz/verify&#10;&#10;Or paste an entire SMS, email, or DM — we'll find every link inside."
            rows={5}
            className="w-full resize-y rounded-2xl border border-white/10 bg-[#111] px-4 py-3 text-zinc-100 outline-none ring-red-500/30 placeholder:text-zinc-600 focus:ring-2"
          />
        </label>
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="w-full rounded-full bg-red-500 px-6 py-4 text-base font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {loading ? "Scanning…" : "Check link"}
        </button>
      </form>

      {error && (
        <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {result && overall && (
        <div className="mt-8 space-y-4">
          <div
            className={`rounded-2xl border p-5 ${overall.bg} ${overall.border}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">Scan result</h2>
              <RiskBadge risk={result.overallRisk} />
            </div>
            <p className={`mt-2 ${overall.text}`}>{result.message}</p>
          </div>
          {reportMsg && (
            <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
              {reportMsg}
            </p>
          )}
          {result.urls.map((u) => (
            <UrlResultCard
              key={u.normalizedUrl}
              result={u}
              onReport={handleReport}
            />
          ))}
        </div>
      )}
    </div>
  );
}
