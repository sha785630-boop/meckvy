"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const THREADS = [
  {
    guest: "Wei Chen",
    lang: "Chinese",
    original: "有空房吗？6月12–15日双人房…",
    preview: "Do you have a twin room for June 12–15?",
  },
  {
    guest: "Anna Müller",
    lang: "German",
    original: "Können Sie einen Speedboat-Transfer…",
    preview: "Can you arrange a speedboat transfer?",
  },
  {
    guest: "Yuki Tanaka",
    lang: "Website",
    original: "Twin room, late arrival from Male…",
    preview: "Website inquiry — needs sea-view twin",
  },
];

export function ProductPreview() {
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const active = THREADS[index]!;

  useEffect(() => {
    const reply =
      "Yes — twin with breakfast is available. Speedboat is 25 min, $35 pp.";
    setTyped("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTyped(reply.slice(0, i));
      if (i >= reply.length) window.clearInterval(id);
    }, 28);
    return () => window.clearInterval(id);
  }, [index]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((n) => (n + 1) % THREADS.length);
    }, 5200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-5xl">
      <div className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-lagoon/15 via-transparent to-coral/10 blur-2xl" />
      <div className="relative grid overflow-hidden rounded-[1.75rem] border border-line/70 bg-foam shadow-[0_24px_80px_rgba(20,37,38,0.12)] md:grid-cols-[0.95fr_1.15fr]">
        <div className="border-b border-line bg-sand/60 p-5 md:border-b-0 md:border-r md:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lagoon-deep">
            Guest widget
          </p>
          <p className="mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold text-ink">
            Message us
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            Lives on the guesthouse website
          </p>
          <div className="mt-6 space-y-3 text-sm">
            <div className="rounded-xl border border-line bg-white px-3 py-2.5 text-ink-soft">
              {active.guest}
            </div>
            <div className="min-h-[88px] rounded-xl border border-line bg-white px-3 py-2.5 text-ink">
              {active.original}
            </div>
            <div className="rounded-full bg-lagoon px-4 py-2.5 text-center text-sm font-semibold text-foam">
              Send to inbox
            </div>
          </div>
        </div>

        <div className="bg-foam p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lagoon-deep">
              Your Meckvy inbox
            </p>
            <span className="text-xs text-coral">1 new</span>
          </div>

          <div className="mt-5 space-y-2">
            {THREADS.map((t, i) => (
              <button
                key={t.guest}
                type="button"
                onClick={() => setIndex(i)}
                className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                  i === index
                    ? "border-lagoon/40 bg-lagoon-mist/35"
                    : "border-transparent bg-sand/50 hover:bg-sand"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{t.guest}</p>
                  <span className="text-[10px] font-medium uppercase tracking-wide text-ink-soft">
                    {t.lang}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-ink-soft">{t.preview}</p>
              </button>
            ))}
          </div>

          <div className="mt-5 border-t border-line pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Your reply (English)
            </p>
            <p className="mt-2 min-h-[64px] whitespace-pre-wrap text-sm leading-relaxed text-ink">
              {typed}
              <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-lagoon align-middle" />
            </p>
            <p className="mt-3 text-xs text-lagoon-deep">
              Guest receives this in their language · one tap
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link
          href="/login"
          className="btn-lift rounded-full bg-coral px-6 py-3 text-sm font-semibold text-foam hover:brightness-110"
        >
          Open the live demo
        </Link>
        <Link
          href="/widget/gh-demo"
          className="btn-lift rounded-full border border-lagoon/25 bg-foam px-6 py-3 text-sm font-medium text-lagoon-deep hover:border-lagoon"
        >
          Try the guest form
        </Link>
      </div>
    </div>
  );
}
