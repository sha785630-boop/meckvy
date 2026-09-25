import type { Metadata } from "next";
import Link from "next/link";
import { ReviewCard, Stars } from "@/components/ReviewCard";
import { listPublicReviews } from "@/lib/reviews";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reviews — Meckvy",
  description: "What Maldivian guesthouse owners say about Meckvy.",
};

export default async function ReviewsPage() {
  const reviews = await listPublicReviews();
  const average =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <main className="sand-glow min-h-screen">
      <header className="flex items-center justify-between border-b border-line/70 bg-foam/75 px-6 py-5 backdrop-blur-md md:px-10">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-xl font-semibold text-lagoon-deep"
        >
          Meckvy
        </Link>
        <div className="flex items-center gap-4 text-sm font-medium">
          <Link href="/pricing" className="text-ink-soft hover:text-ink">
            Pricing
          </Link>
          <Link
            href="/register"
            className="btn-lift rounded-full bg-coral px-4 py-2 font-semibold text-foam hover:brightness-110"
          >
            Start free trial
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-14 md:px-10">
        <p className="animate-fade-up text-sm font-semibold uppercase tracking-[0.2em] text-coral">
          Reviews
        </p>
        <h1 className="animate-fade-up-delay mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold text-ink md:text-5xl">
          What guesthouse owners say
        </h1>

        {reviews.length > 0 ? (
          <>
            <div className="animate-fade-up-delay-2 mt-6 flex flex-wrap items-center gap-3">
              <span className="font-[family-name:var(--font-display)] text-4xl font-semibold text-lagoon-deep">
                {average.toFixed(1)}
              </span>
              <Stars rating={Math.round(average)} className="text-2xl" />
              <span className="text-sm text-ink-soft">
                from {reviews.length} guesthouse{reviews.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="animate-fade-up-delay-3 mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {reviews.map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </div>
          </>
        ) : (
          <div className="animate-fade-up-delay-2 mt-10 max-w-xl rounded-2xl border border-line bg-foam p-8">
            <p className="text-lg text-ink">
              Meckvy just launched — the first reviews from island guesthouses
              are on their way.
            </p>
            <p className="mt-3 text-ink-soft">
              Start your free trial and be one of the first owners featured
              here.
            </p>
            <Link
              href="/register"
              className="btn-lift mt-6 inline-flex rounded-full bg-lagoon px-6 py-3 text-sm font-semibold text-foam hover:bg-lagoon-deep"
            >
              Start free trial
            </Link>
          </div>
        )}

        <p className="mt-12 text-sm text-ink-soft">
          Reviews are written by guesthouses using Meckvy, from inside their
          account. Using Meckvy?{" "}
          <Link href="/dashboard/review" className="text-lagoon-deep underline">
            Leave your review
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
