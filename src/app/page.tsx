import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { ProductPreview } from "@/components/ProductPreview";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-5 md:px-10">
        <span className="animate-fade-in font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-foam md:text-3xl">
          Meckvy
        </span>
        <div className="animate-fade-in flex items-center gap-2 sm:gap-3">
          <Link
            href="/pricing"
            className="btn-lift hidden rounded-full border border-foam/35 bg-foam/10 px-4 py-2.5 text-sm font-medium text-foam backdrop-blur hover:bg-foam/20 sm:inline-flex"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="btn-lift rounded-full bg-foam px-5 py-2.5 text-sm font-semibold text-ink hover:bg-white"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* HERO — brand first, one offer, one image */}
      <section className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden px-6 pb-16 pt-28 md:px-10 md:pb-24">
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src="/redhan.jpeg"
            alt="Bioluminescent Maldivian shoreline at night — Meckvy cover"
            fill
            priority
            sizes="100vw"
            className="animate-ken-burns object-cover object-[center_35%]"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/25" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(197,228,227,0.28),transparent_50%)]" />
        <div className="grain pointer-events-none absolute inset-0 opacity-35" />

        <div className="relative z-10 mx-auto w-full max-w-5xl">
          <p className="animate-fade-up font-[family-name:var(--font-display)] text-6xl font-semibold tracking-tight text-foam sm:text-7xl md:text-8xl lg:text-[7.5rem] lg:leading-[0.9]">
            Meckvy
          </p>
          <div
            className="animate-shimmer-line mt-5 h-1 w-32 rounded-full bg-gradient-to-r from-coral via-lagoon-mist to-transparent sm:w-44"
            aria-hidden
          />
          <h1 className="animate-fade-up-delay mt-7 max-w-3xl text-3xl font-medium leading-[1.15] text-foam sm:text-4xl md:text-5xl">
            Never miss a booking enquiry again.
          </h1>
          <p className="animate-fade-up-delay-2 mt-5 max-w-xl text-lg leading-relaxed text-foam/85 md:text-xl">
            Guest messages from your website land in one inbox. Reply in
            English — Meckvy sends it in their language.
          </p>
          <div className="animate-fade-up-delay-3 mt-10 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="btn-lift rounded-full bg-coral px-8 py-4 text-base font-semibold text-foam shadow-[0_16px_40px_rgba(212,101,74,0.35)] hover:brightness-110"
            >
              Try free demo
            </Link>
            <Link
              href="/pricing"
              className="btn-lift rounded-full border border-foam/45 bg-foam/10 px-8 py-4 text-base font-medium text-foam backdrop-blur hover:bg-foam/20"
            >
              From $29 / month
            </Link>
          </div>
        </div>
      </section>

      {/* Island strip */}
      <div className="overflow-hidden border-y border-line bg-ink py-3 text-foam/70">
        <div className="animate-marquee flex whitespace-nowrap text-sm tracking-wide">
          <span className="mx-8">
            Maafushi · Thulusdhoo · Hulhumalé · Guraidhoo · Dhiffushi · Gulhi ·
            Himmafushi · Rasdhoo · Ukulhas · Maafushi · Thulusdhoo · Hulhumalé ·
            Guraidhoo · Dhiffushi · Gulhi · Himmafushi · Rasdhoo · Ukulhas
          </span>
          <span className="mx-8" aria-hidden>
            Maafushi · Thulusdhoo · Hulhumalé · Guraidhoo · Dhiffushi · Gulhi ·
            Himmafushi · Rasdhoo · Ukulhas · Maafushi · Thulusdhoo · Hulhumalé ·
            Guraidhoo · Dhiffushi · Gulhi · Himmafushi · Rasdhoo · Ukulhas
          </span>
        </div>
      </div>

      {/* Pain → value */}
      <section className="bg-foam px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-coral">
              The problem
            </p>
            <h2 className="mt-3 max-w-3xl font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight text-ink md:text-5xl">
              Guests message while you&apos;re busy at reception — and choose
              another house.
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-10 md:grid-cols-2">
            <Reveal delay={1}>
              <p className="border-t border-line pt-6 text-lg leading-relaxed text-ink-soft">
                Chinese, Russian, German, Italian guests write all day. Staff
                copy-paste into Google Translate, miss transfers, and lose
                bookings on busy nights.
              </p>
            </Reveal>
            <Reveal delay={2}>
              <p className="border-t border-lagoon/30 pt-6 text-lg leading-relaxed text-lagoon-deep">
                Meckvy puts every website enquiry in one place, with English
                previews and ready replies — so you answer fast and sound
                professional.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Live product */}
      <section className="sand-glow px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lagoon">
              See it working
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold text-ink md:text-5xl">
              This is what you show a guesthouse owner.
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-ink-soft">
              Widget on their website. Inbox on your phone. Reply once —
              translated for the guest.
            </p>
          </Reveal>
          <Reveal delay={1} className="mt-12">
            <ProductPreview />
          </Reveal>
        </div>
      </section>

      {/* How */}
      <section className="bg-ink px-6 py-20 text-foam md:px-10 md:py-28">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold md:text-5xl">
              Live in one afternoon
            </h2>
            <p className="mt-4 max-w-xl text-foam/70">
              No Meta WhatsApp setup required to start. Paste the widget, open
              Inbox, take bookings.
            </p>
          </Reveal>
          <ol className="mt-14 space-y-0">
            {[
              {
                n: "1",
                t: "Paste the widget",
                d: "One script on their website — or share a direct link / QR.",
              },
              {
                n: "2",
                t: "Guests inquire",
                d: "Rooms, transfers, check-in — messages hit your Meckvy inbox.",
              },
              {
                n: "3",
                t: "You reply & earn",
                d: "Templates + translation. Close the booking before they message the next house.",
              },
            ].map((step, i) => (
              <Reveal key={step.n} delay={(i + 1) as 1 | 2 | 3}>
                <li className="grid gap-4 border-t border-foam/15 py-8 md:grid-cols-[4rem_1fr_1.4fr] md:items-baseline">
                  <span className="font-[family-name:var(--font-display)] text-4xl text-coral">
                    {step.n}
                  </span>
                  <span className="text-2xl font-semibold">{step.t}</span>
                  <span className="text-foam/70">{step.d}</span>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Pricing tease */}
      <section className="lagoon-band px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-ink md:text-5xl">
              Less than one lost booking.
            </h2>
            <p className="mt-4 max-w-xl text-lg text-ink-soft">
              Starter is $29/month. Pro is $59 with email replies and
              automations. Cancel anytime.
            </p>
          </Reveal>
          <Reveal delay={1} className="mt-10 flex flex-wrap gap-8">
            <div>
              <p className="font-[family-name:var(--font-display)] text-5xl font-semibold text-lagoon-deep">
                $29
              </p>
              <p className="mt-1 text-sm text-ink-soft">Starter / month</p>
            </div>
            <div>
              <p className="font-[family-name:var(--font-display)] text-5xl font-semibold text-lagoon-deep">
                $59
              </p>
              <p className="mt-1 text-sm text-ink-soft">Pro / month</p>
            </div>
          </Reveal>
          <Reveal delay={2} className="mt-10">
            <Link
              href="/pricing"
              className="btn-lift inline-flex rounded-full bg-lagoon px-8 py-4 text-base font-semibold text-foam hover:bg-lagoon-deep"
            >
              Choose a plan
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden px-6 py-24 md:px-10 md:py-32">
        <div className="ocean-wash absolute inset-0" />
        <div className="grain pointer-events-none absolute inset-0 opacity-25" />
        <div className="relative mx-auto max-w-5xl text-center">
          <Reveal>
            <p className="font-[family-name:var(--font-display)] text-4xl font-semibold text-foam md:text-6xl">
              Ready to sell quieter days?
            </p>
            <p className="mx-auto mt-5 max-w-lg text-lg text-foam/80">
              Demo login is ready — show a guesthouse owner today and close
              this week.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/login"
                className="btn-lift rounded-full bg-foam px-8 py-4 text-base font-semibold text-lagoon-deep hover:bg-white"
              >
                Start demo now
              </Link>
              <Link
                href="/pricing"
                className="btn-lift rounded-full border border-foam/40 px-8 py-4 text-base font-medium text-foam hover:bg-foam/10"
              >
                View pricing
              </Link>
            </div>
            <p className="mt-8 text-sm text-foam/60">
              Demo: demo@meckvy.mv · demo1234
            </p>
          </Reveal>
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
