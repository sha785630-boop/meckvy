import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-5 md:px-10">
        <span className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-foam">
          Meckvy
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/pricing"
            className="rounded-full border border-foam/35 bg-foam/10 px-4 py-2.5 text-sm font-medium text-foam backdrop-blur transition hover:bg-foam/20"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-foam/95 px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-white"
          >
            Sign in
          </Link>
        </div>
      </header>

      <section className="ocean-wash relative flex min-h-[100svh] flex-col justify-end overflow-hidden px-6 pb-16 pt-28 md:px-10 md:pb-20">
        <div className="grain pointer-events-none absolute inset-0 opacity-40" />
        <div className="animate-drift pointer-events-none absolute -right-16 top-24 h-64 w-64 rounded-full bg-foam/10 blur-2xl md:h-96 md:w-96" />
        <div className="relative z-10 mx-auto w-full max-w-5xl">
          <p className="animate-fade-up font-[family-name:var(--font-display)] text-5xl font-semibold tracking-tight text-foam sm:text-6xl md:text-7xl lg:text-8xl">
            Meckvy
          </p>
          <h1 className="animate-fade-up-delay mt-5 max-w-2xl text-2xl font-medium leading-snug text-foam/95 sm:text-3xl md:text-4xl">
            WhatsApp & email on autopilot for Maldivian guesthouses.
          </h1>
          <p className="animate-fade-up-delay-2 mt-4 max-w-xl text-base leading-relaxed text-foam/80 md:text-lg">
            Reply once in your language — guests get the message in theirs.
            Booking, transfers, and check-in handled while you run the house.
          </p>
          <div className="animate-fade-up-delay-2 mt-8 flex flex-wrap gap-3">
            <Link
              href="/pricing"
              className="rounded-full bg-coral px-7 py-3.5 text-sm font-semibold text-foam shadow-lg shadow-ink/20 transition hover:brightness-110"
            >
              See pricing
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-foam/35 bg-foam/10 px-7 py-3.5 text-sm font-medium text-foam backdrop-blur transition hover:bg-foam/20"
            >
              Try the demo
            </Link>
          </div>
        </div>
      </section>

      <section id="how" className="bg-foam px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-ink md:text-4xl">
            Built for island guesthouses
          </h2>
          <p className="mt-3 max-w-2xl text-ink-soft">
            One inbox for WhatsApp and email. Templates for the questions you
            answer every day. Translation that keeps Chinese, Russian, German,
            Italian — and Dhivehi — guests happy without staff burnout.
          </p>

          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {[
              {
                title: "Unified inbox",
                copy: "WhatsApp chats and booking emails in one place. Read the guest language, see an English preview, reply without switching apps.",
              },
              {
                title: "Live translation",
                copy: "Write in English or Dhivehi. Meckvy sends in the guest’s language — booking confirms, transfer times, house rules included.",
              },
              {
                title: "Automations that save hours",
                copy: "Auto-ack new enquiries, send check-in 24 hours before arrival, and answer transfer FAQs while you handle arrivals.",
              },
            ].map((item) => (
              <div key={item.title} className="border-t border-line pt-6">
                <h3 className="text-lg font-semibold text-lagoon-deep">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {item.copy}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-sand px-6 py-20 md:px-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-ink md:text-4xl">
              Sell Meckvy. Run quieter days.
            </h2>
            <p className="mt-3 max-w-lg text-ink-soft">
              Demo the product to guesthouses on Maafushi, Thulusdhoo, Hulhumalé
              and beyond — then connect their real WhatsApp Business and email.
            </p>
          </div>
          <Link
            href="/pricing"
            className="inline-flex shrink-0 rounded-full bg-lagoon px-7 py-3.5 text-sm font-semibold text-foam transition hover:bg-lagoon-deep"
          >
            Get started — pricing
          </Link>
        </div>
      </section>

      <footer className="border-t border-line bg-foam px-6 py-8 text-sm text-ink-soft md:px-10">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <span className="font-[family-name:var(--font-display)] text-lg font-semibold text-ink">
            Meckvy
          </span>
          <span>Guesthouse automation · Maldives</span>
        </div>
      </footer>
    </main>
  );
}
