"use client";

import { useState } from "react";

export function ChangePassword() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current, next }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setMessage({ ok: false, text: data.error ?? "Could not change your password" });
        return;
      }
      setCurrent("");
      setNext("");
      setMessage({ ok: true, text: "Password changed ✓" });
    } catch {
      setMessage({ ok: false, text: "No connection — try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mb-6 rounded-2xl border border-line bg-foam p-6">
      <h2 className="text-lg font-semibold text-ink">Change password</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Got a temporary password? Swap it for one you’ll remember.
      </p>
      <form onSubmit={(e) => void submit(e)} className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-ink-soft">Current password</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-ink outline-none ring-lagoon focus:ring-2"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink-soft">New password (6+ characters)</span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-ink outline-none ring-lagoon focus:ring-2"
          />
        </label>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-lagoon px-5 py-2.5 text-sm font-semibold text-foam hover:bg-lagoon-deep disabled:opacity-50"
          >
            {busy ? "Saving…" : "Change password"}
          </button>
          {message && (
            <p className={`text-sm ${message.ok ? "text-emerald-700" : "text-coral"}`} role="status">
              {message.text}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}
