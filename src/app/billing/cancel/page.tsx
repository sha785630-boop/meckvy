import Link from "next/link";

export default function BillingCancelPage() {
  return (
    <main className="min-h-screen bg-sand">
      <header className="border-b border-line bg-foam px-6 py-5">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-xl font-semibold text-lagoon-deep"
        >
          Meckvy
        </Link>
      </header>
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">
          Checkout canceled
        </h1>
        <p className="mt-3 text-ink-soft">
          No charge was made. You can subscribe anytime from pricing.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/pricing"
            className="rounded-full bg-lagoon px-6 py-3 text-sm font-semibold text-foam hover:bg-lagoon-deep"
          >
            Back to pricing
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full border border-line px-6 py-3 text-sm font-medium text-ink-soft hover:bg-foam"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
