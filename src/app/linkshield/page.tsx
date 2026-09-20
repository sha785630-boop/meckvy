import Link from "next/link";
import CommunityShield from "@/components/CommunityShield";
import { LinkShieldHeader } from "@/components/LinkShieldChrome";
import ShieldScanner from "@/components/ShieldScanner";

const CHANNELS = [
  {
    name: "WhatsApp & Telegram",
    desc: "Browser extension watches WhatsApp Web and Telegram — instant popup when a scam link arrives.",
  },
  {
    name: "Gmail & Email",
    desc: "Extension scans new emails automatically. Dangerous links trigger a notification.",
  },
  {
    name: "Instagram & Messenger",
    desc: "Monitors web DMs in your browser and warns you before you tap a fake link.",
  },
  {
    name: "Push notifications",
    desc: "Get alerted on your phone or desktop the moment a hacker's link is detected.",
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

export default function LinkShieldPage() {
  return (
    <main>
      <LinkShieldHeader
        right={
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/linkshield/protect"
              className="hidden text-sm text-zinc-400 hover:text-white sm:inline"
            >
              Protect
            </Link>
            <Link
              href="/linkshield/install"
              className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400"
            >
              Install free
            </Link>
          </div>
        }
      />

      <section className="relative overflow-hidden border-b border-white/10 px-6 py-16 md:px-10 md:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(239,68,68,0.18),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_90%_40%,rgba(255,255,255,0.06),transparent_40%)]" />
        <div className="relative mx-auto max-w-5xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-red-400">
            Stronger together
          </p>
          <h1 className="mt-3 max-w-2xl font-[family-name:var(--font-display)] text-4xl font-semibold leading-tight text-white md:text-5xl">
            Hackers send more links than ever. We stop them together.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-zinc-400">
            LinkShield blocks scam clicks in your apps, reads pressure tactics in
            messages, and shares confirmed threats across the community — so one
            report protects everyone.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/linkshield/install"
              className="inline-flex rounded-full bg-red-500 px-8 py-4 text-base font-semibold text-white hover:bg-red-400"
            >
              Install free for everyone →
            </Link>
            <Link
              href="/linkshield/protect"
              className="inline-flex rounded-full border border-white/20 bg-white/5 px-8 py-4 text-base font-medium text-zinc-100 hover:bg-white/10"
            >
              Turn on auto-protection
            </Link>
            <a
              href="#community"
              className="inline-flex rounded-full border border-white/10 px-8 py-4 text-base font-medium text-zinc-400 hover:border-white/25 hover:text-white"
            >
              Community feed
            </a>
          </div>
        </div>
      </section>

      <section className="px-6 py-12 md:px-10">
        <div className="mx-auto mb-6 max-w-3xl">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-white">
            Scan a link or full message
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Paste many links at once — we analyze up to 25 and check for scare
            tactics in the text.
          </p>
        </div>
        <ShieldScanner />
      </section>

      <section
        id="community"
        className="border-t border-white/10 bg-zinc-950 px-6 py-16 md:px-10"
      >
        <CommunityShield />
      </section>

      <section className="border-t border-white/10 px-6 py-16 md:px-10">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-white">
            Works across your apps
          </h2>
          <p className="mt-2 max-w-2xl text-zinc-400">
            Install the LinkShield browser extension once. It connects to
            WhatsApp Web, Gmail, Telegram, and more — scanning every new message
            and alerting you if a link looks like a scam.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {CHANNELS.map((c) => (
              <div
                key={c.name}
                className="rounded-2xl border border-white/10 bg-[#111] p-5"
              >
                <h3 className="font-semibold text-white">{c.name}</h3>
                <p className="mt-1 text-sm text-zinc-500">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-6 py-16 md:px-10">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-white">
            What we detect
          </h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {CHECKS.map((check) => (
              <li
                key={check}
                className="flex items-start gap-2 rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-zinc-300"
              >
                <span className="text-red-400" aria-hidden>
                  ✓
                </span>
                {check}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-white/10 bg-black px-6 py-12 md:px-10">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-white">
            Automatic protection is ready
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-zinc-500">
            Install the extension, enable notifications, and LinkShield will warn
            you the moment someone sends a suspicious link.
          </p>
          <Link
            href="/linkshield/install"
            className="mt-6 inline-flex rounded-full bg-red-500 px-8 py-3 text-sm font-semibold text-white hover:bg-red-400"
          >
            Install free
          </Link>
        </div>
      </section>
    </main>
  );
}
