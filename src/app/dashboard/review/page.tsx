"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function ReviewPage() {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [authorName, setAuthorName] = useState("");
  const [body, setBody] = useState("");
  const [isDemo, setIsDemo] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetch("/api/reviews?mine=1")
      .then((r) => r.json())
      .then(
        (d: {
          isDemo?: boolean;
          review?: { authorName: string; rating: number; body: string } | null;
        }) => {
          setIsDemo(Boolean(d.isDemo));
          if (d.review) {
            setHasExisting(true);
            setAuthorName(d.review.authorName);
            setRating(d.review.rating);
            setBody(d.review.body);
          }
        },
      );
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorName, rating, body }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not save review");
        return;
      }
      setDone(true);
      setHasExisting(true);
    } finally {
      setBusy(false);
    }
  }

  const shown = hover || rating;

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">
          Leave a review
        </h1>
        <p className="mt-1 text-ink-soft">
          How is Meckvy working for your guesthouse? Your honest review helps
          other owners on the islands decide.
        </p>
      </header>

      {isDemo ? (
        <p className="rounded-2xl border border-line bg-foam px-5 py-6 text-sm text-ink-soft">
          Reviews come from real guesthouses only.{" "}
          <Link href="/register" className="text-lagoon-deep underline">
            Create your free account
          </Link>{" "}
          to share yours.
        </p>
      ) : done ? (
        <div className="animate-fade-up rounded-2xl border border-lagoon/30 bg-foam px-6 py-8 text-center">
          <p className="font-[family-name:var(--font-display)] text-3xl text-ink">
            Shukuriyya! 🌴
          </p>
          <p className="mt-2 text-sm text-ink-soft">
            Your review is live on the Meckvy reviews page.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link
              href="/reviews"
              className="btn-lift rounded-full bg-lagoon px-5 py-2.5 text-sm font-semibold text-foam hover:bg-lagoon-deep"
            >
              See reviews
            </Link>
            <button
              type="button"
              onClick={() => setDone(false)}
              className="btn-lift rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink hover:bg-sand"
            >
              Edit my review
            </button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={(e) => void submit(e)}
          className="space-y-5 rounded-2xl border border-line bg-foam p-6"
        >
          <div>
            <p className="text-sm font-medium text-ink-soft">Your rating</p>
            <div className="mt-2 flex gap-1" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  onMouseEnter={() => setHover(n)}
                  onClick={() => setRating(n)}
                  className={`text-4xl transition-transform hover:scale-110 ${
                    n <= shown ? "text-coral" : "text-line"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <label className="block text-sm">
            <span className="font-medium text-ink-soft">Your name (shown publicly)</span>
            <input
              required
              maxLength={60}
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Ahmed, owner"
              className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-ink outline-none ring-lagoon focus:ring-2"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-ink-soft">Your review</span>
            <textarea
              required
              minLength={10}
              maxLength={800}
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What changed since you started using Meckvy?"
              className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-ink outline-none ring-lagoon focus:ring-2"
            />
          </label>

          <p className="text-xs text-ink-soft">
            Your guesthouse name and island are shown with your review.
          </p>

          <button
            type="submit"
            disabled={busy}
            className="btn-lift w-full rounded-full bg-coral py-3 text-sm font-semibold text-foam hover:brightness-110 disabled:opacity-50"
          >
            {busy ? "Saving…" : hasExisting ? "Update review" : "Publish review"}
          </button>
          {error && (
            <p className="text-sm text-coral" role="alert">
              {error}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
