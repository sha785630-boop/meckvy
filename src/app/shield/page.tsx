import type { Metadata } from "next";
import Link from "next/link";
import CommunityShield from "@/components/CommunityShield";
import ShieldScanner from "@/components/ShieldScanner";

export const metadata: Metadata = {
  title: "LinkShield — Community phishing protection",
  description:
    "Strong phishing defense for everyone. Auto-scan WhatsApp, Gmail & DMs, block scam clicks, and share threats so the whole community stays safe.",
};

const CHANNELS = [
  {
    name: "WhatsApp & Telegram",
    desc: "Browser extension watches WhatsApp Web and Telegram — instant popup when a scam link arrives.",
    icon: "💬",
  },
  {
    name: "Gmail & Email",
    desc: "Extension scans new emails automatically. Dangerous links trigger a notification.",
    icon: "✉️",
  },
  {
    name: "Instagram & Messenger",
    desc: "Monitors web DMs in your browser and warns you before you tap a fake link.",
    icon: "🌐",
  },
  {
    name: "Push notifications",
    desc: "Get alerted on your phone or desktop the moment a hacker's link is detected.",
    icon: "🔔",
  },
];

const CHECKS = [
  "Fake PayPal, bank, crypto & social login pages",
  "Look-alike domains (paypa1.com, amaz0n.net)",
  "Free-host phishing kits (Vercel, GitHub Pages, Netlify)",
  "Scare tactics: “verify now”, “account locked”, OTP asks",
  "Community-confirmed scam blocklist (shared by everyone)",
  "Click blocking — dangerous links cannot be opened",
  "URL shorteners, IP hosts, Unicode look-alikes",
  "Google Safe Browsing blacklist (when configured)",
];

export default function ShieldPage() {
  return (
    <main className="min-h-screen bg-foam">
      <header className="border-b border-line bg-ink px-6 py-4 text-foam md:px-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <p className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
              LinkShield
            </p>
            <p className="text-sm text-foam/70">Phishing link detector</p>
          </div>
          <Link
            href="/shield/install"
            className="rounded-full bg-coral px-4 py-2 text-sm font-semibold text-foam hover:brightness-110"
          >
            Install free
          </Link>
        </div>
      </header>

      <section className="border-b border-line bg-gradient-to-b from-lagoon-mist/40 to-foam px-6 py-16 md:px-10 md:py-24">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-lagoon">
            Stronger together
          </p>
          <h1 className="mt-3 max-w-2xl font-[family-name:var(--font-display)] text-4xl font-semibold leading-tight text-ink md:text-5xl">
            Hackers send more links than ever. We stop them together.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-ink/75">
            LinkShield blocks scam clicks in your apps, reads pressure tactics in
            messages, and shares confirmed threats across the community — so one
            report protects everyone.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/shield/install"
              className="inline-flex rounded-full bg-lagoon px-8 py-4 text-base font-semibold text-foam hover:bg-lagoon-deep"
            >
              Install free for everyone →
            </Link>
            <Link
              href="/shield/protect"
              className="inline-flex rounded-full border border-lagoon/40 bg-white px-8 py-4 text-base font-medium text-lagoon-deep hover:bg-lagoon-mist/40"
            >
              Turn on auto-protection
            </Link>
            <a
              href="#community"
              className="inline-flex rounded-full border border-line bg-white/80 px-8 py-4 text-base font-medium text-ink/80 hover:bg-white"
            >
              Community feed
            </a>
          </div>
        </div>
      </section>

      <section className="px-6 py-12 md:px-10">
        <div className="mx-auto mb-6 max-w-3xl">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-ink">
            Scan a link or full message
          </h2>
          <p className="mt-1 text-sm text-ink/65">
            Paste many links at once — we analyze up to 25 and check for scare tactics in the text.
          </p>
        </div>
        <ShieldScanner />
      </section>

      <section
        id="community"
        className="border-t border-line bg-sand/40 px-6 py-16 md:px-10"
      >
        <CommunityShield />
      </section>

      <section className="border-t border-line bg-sand/50 px-6 py-16 md:px-10">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-ink">
            Works across your apps
          </h2>
          <p className="mt-2 max-w-2xl text-ink/70">
            Install the LinkShield browser extension once. It connects to
            WhatsApp Web, Gmail, Telegram, and more — scanning every new message
            and alerting you if a link looks like a scam.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {CHANNELS.map((c) => (
              <div
                key={c.name}
                className="rounded-2xl border border-line bg-white p-5 shadow-sm"
              >
                <span className="text-2xl" aria-hidden>
                  {c.icon}
                </span>
                <h3 className="mt-3 font-semibold text-ink">{c.name}</h3>
                <p className="mt-1 text-sm text-ink/70">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:px-10">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-ink">
            What we detect
          </h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {CHECKS.map((check) => (
              <li
                key={check}
                className="flex items-start gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink/80"
              >
                <span className="text-lagoon" aria-hidden>
                  ✓
                </span>
                {check}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-line bg-ink px-6 py-12 text-foam md:px-10">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
            Automatic protection is ready
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-foam/75">
            Install the extension, enable notifications, and LinkShield will warn
            you the moment someone sends a suspicious link.
          </p>
          <Link
            href="/shield/install"
            className="mt-6 inline-flex rounded-full bg-coral px-8 py-3 text-sm font-semibold text-foam hover:brightness-110"
          >
            Install free
          </Link>
        </div>
      </section>
    </main>
  );
}
