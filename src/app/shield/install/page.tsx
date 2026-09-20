import type { Metadata } from "next";
import Link from "next/link";
import InstallApiHint from "@/components/InstallApiHint";

export const metadata: Metadata = {
  title: "Install LinkShield — Free phishing protection for everyone",
  description:
    "Install LinkShield in 2 minutes. Auto-block scam links on WhatsApp, Gmail, and Telegram. Free for everyone.",
};

export default function InstallPage() {
  return (
    <main className="min-h-screen bg-foam">
      <header className="border-b border-line bg-ink px-6 py-4 text-foam md:px-10">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link
            href="/shield"
            className="font-[family-name:var(--font-display)] text-xl font-semibold"
          >
            LinkShield
          </Link>
          <Link href="/shield" className="text-sm text-foam/70 hover:text-foam">
            Open scanner
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-14 md:px-10">
        <p className="text-sm font-semibold uppercase tracking-widest text-lagoon">
          Free for everyone
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold leading-tight text-ink">
          Install LinkShield in 2 minutes
        </h1>
        <p className="mt-4 text-lg text-ink/75">
          Once installed, scam links in WhatsApp Web, Gmail, Telegram, Messenger,
          and Instagram are scanned automatically — and dangerous clicks are blocked.
        </p>

        <ol className="mt-10 space-y-6">
          <li className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-lagoon">
              Step 1
            </p>
            <h2 className="mt-1 text-lg font-semibold text-ink">
              Download the extension
            </h2>
            <p className="mt-2 text-sm text-ink/70">
              Download the ready-to-install zip, unzip it, then load the folder
              in Chrome.
            </p>
            <a
              href="/linkshield-extension.zip"
              className="mt-4 inline-flex rounded-full bg-lagoon px-5 py-2.5 text-sm font-semibold text-foam hover:bg-lagoon-deep"
            >
              Download LinkShield extension (.zip)
            </a>
          </li>

          <li className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-lagoon">
              Step 2
            </p>
            <h2 className="mt-1 text-lg font-semibold text-ink">
              Load it in Chrome or Edge
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-ink/80">
              <li>
                Open{" "}
                <code className="rounded bg-sand px-1 text-xs">chrome://extensions</code>
              </li>
              <li>Turn on <strong>Developer mode</strong> (top right)</li>
              <li>Click <strong>Load unpacked</strong></li>
              <li>
                Select the{" "}
                <code className="rounded bg-sand px-1 text-xs">linkshield</code> folder
              </li>
            </ol>
          </li>

          <li className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-lagoon">
              Step 3
            </p>
            <h2 className="mt-1 text-lg font-semibold text-ink">
              Point it at this site
            </h2>
            <InstallApiHint />
          </li>

          <li className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-lagoon">
              Step 4
            </p>
            <h2 className="mt-1 text-lg font-semibold text-ink">
              Turn on notifications
            </h2>
            <p className="mt-2 text-sm text-ink/70">
              Open Protect and allow notifications so you get alerted the moment
              a scam link appears.
            </p>
            <Link
              href="/shield/protect"
              className="mt-4 inline-flex rounded-full border border-lagoon/40 px-5 py-2.5 text-sm font-semibold text-lagoon-deep hover:bg-lagoon-mist/40"
            >
              Open Protect →
            </Link>
          </li>
        </ol>

        <section className="mt-12 rounded-2xl border border-line bg-ink px-6 py-8 text-foam">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
            No extension? Use the web scanner
          </h2>
          <p className="mt-2 text-sm text-foam/75">
            Anyone can paste a suspicious link or message at{" "}
            <Link href="/shield" className="underline">
              /shield
            </Link>{" "}
            — free, no account required. Report scams to protect the community.
          </p>
        </section>
      </div>
    </main>
  );
}
