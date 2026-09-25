import type { PublicReview } from "@/lib/reviews";

export function Stars({ rating, className = "" }: { rating: number; className?: string }) {
  return (
    <span className={`tracking-tight ${className}`} aria-label={`${rating} out of 5 stars`}>
      <span className="text-coral">{"★".repeat(rating)}</span>
      <span className="text-line">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export function ReviewCard({ review }: { review: PublicReview }) {
  return (
    <figure className="flex h-full flex-col rounded-2xl border border-line/80 bg-foam p-6">
      <Stars rating={review.rating} className="text-lg" />
      <blockquote className="mt-3 flex-1 text-[15px] leading-relaxed text-ink">
        “{review.body}”
      </blockquote>
      <figcaption className="mt-5 text-sm">
        <span className="font-semibold text-ink">{review.authorName}</span>
        <span className="block text-ink-soft">
          {review.guesthouseName} · {review.island}
        </span>
      </figcaption>
    </figure>
  );
}
