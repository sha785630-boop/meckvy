"use client";

import { useEffect, useState } from "react";

type Threat = {
  id: string;
  domain: string;
  risk: string;
  reportCount: number;
  reason: string | null;
  lastSeenAt: string;
  source: string;
};

type Stats = {
  knownThreats: number;
  threatsLast24h: number;
  dangerousThreats: number;
  alertsLast24h: number;
};

export default function CommunityShield() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [threats, setThreats] = useState<Threat[]>([]);
  const [reportUrl, setReportUrl] = useState("");
  const [reportNote, setReportNote] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    const res = await fetch("/api/shield/community");
    if (!res.ok) return;
    const data = await res.json();
    setStats(data.stats);
    setThreats(data.threats ?? []);
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 20000);
    return () => clearInterval(t);
  }, []);

  async function handleReport(e: React.FormEvent) {
    e.preventDefault();
    if (!reportUrl.trim()) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/shield/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: reportUrl.trim(),
          note: reportNote.trim() || undefined,
          clientId:
            typeof window !== "undefined"
              ? localStorage.getItem("linkshield_client_id") || undefined
              : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Report failed");
      setStatus(data.message);
      setReportUrl("");
      setReportNote("");
      await refresh();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not report");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Known threats", value: stats?.knownThreats ?? "—" },
          { label: "New (24h)", value: stats?.threatsLast24h ?? "—" },
          { label: "Confirmed scams", value: stats?.dangerousThreats ?? "—" },
          { label: "Alerts (24h)", value: stats?.alertsLast24h ?? "—" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-white/10 bg-[#111] px-4 py-4"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              {s.label}
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold text-white">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-white/10 bg-[#111] p-6">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-white">
          Report a scam — protect everyone
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          When you report a phishing link, LinkShield adds it to the community
          blocklist. Everyone with the extension gets protected automatically.
        </p>
        <form onSubmit={handleReport} className="mt-4 space-y-3">
          <input
            value={reportUrl}
            onChange={(e) => setReportUrl(e.target.value)}
            placeholder="Paste the scam URL"
            className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-zinc-100 outline-none ring-red-500/30 placeholder:text-zinc-600 focus:ring-2"
          />
          <input
            value={reportNote}
            onChange={(e) => setReportNote(e.target.value)}
            placeholder="Optional: what happened? (e.g. fake PayPal login)"
            className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-zinc-100 outline-none ring-red-500/30 placeholder:text-zinc-600 focus:ring-2"
          />
          <button
            type="submit"
            disabled={loading || !reportUrl.trim()}
            className="rounded-full bg-red-500 px-6 py-3 text-sm font-semibold text-white hover:bg-red-400 disabled:opacity-50"
          >
            {loading ? "Reporting…" : "Report to community"}
          </button>
        </form>
        {status && <p className="mt-3 text-sm text-zinc-300">{status}</p>}
      </section>

      <section>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-white">
          Live community threat feed
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Domains the community (and auto-detection) recently flagged.
        </p>
        {threats.length === 0 ? (
          <p className="mt-4 rounded-xl border border-white/10 bg-[#111] p-5 text-sm text-zinc-500">
            No threats shared yet. Scan or report a scam link to start protecting
            the community.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {threats.map((t) => (
              <li
                key={t.id}
                className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3 text-sm ${
                  t.risk === "dangerous"
                    ? "border-red-500/30 bg-red-500/10"
                    : "border-amber-500/30 bg-amber-500/10"
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate font-mono font-medium text-zinc-100">
                    {t.domain}
                  </p>
                  <p className="text-zinc-500">
                    {t.reason || "Flagged as risky"} · {t.reportCount} report
                    {t.reportCount === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="text-right text-xs text-zinc-500">
                  <p className="font-semibold uppercase tracking-wide text-zinc-300">
                    {t.risk}
                  </p>
                  <p>{new Date(t.lastSeenAt).toLocaleString()}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
