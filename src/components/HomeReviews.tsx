"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ReviewCard } from "@/components/ReviewCard";
import type { PublicReview } from "@/lib/reviews";

export function HomeReviews() {
  const [reviews, setReviews] = useState<PublicReview[]>([]);

  useEffect(() => {
    void fetch("/api/reviews")
      .then((r) => r.json())
      .then((d: { reviews?: PublicReview[] }) => setReviews(d.reviews ?? []))
      .catch(() => setReviews([]));
  }, []);

  if (reviews.length === 0) return null;

  return (
    <section className="bg-foam px-6 py-20 md:px-10 md:py-28">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-coral">
          Loved on the islands
        </p>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold text-ink md:text-5xl">
          Owners using Meckvy
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {reviews.slice(0, 3).map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
        <Link
          href="/reviews"
          className="btn-lift mt-8 inline-flex rounded-full border border-line px-6 py-3 text-sm font-semibold text-lagoon-deep hover:border-lagoon"
        >
          Read all reviews
        </Link>
      </div>
    </section>
  );
}
