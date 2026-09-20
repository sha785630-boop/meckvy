import Link from "next/link";
import InstallApiHint from "@/components/InstallApiHint";
import { LinkShieldHeader } from "@/components/LinkShieldChrome";

export default function LinkShieldInstallPage() {
  return (
    <main>
      <LinkShieldHeader
        right={
          <Link href="/linkshield" className="text-sm text-zinc-400 hover:text-white">
            Open scanner
          </Link>
        }
      />

      <div className="mx-auto max-w-3xl px-6 py-14 md:px-10">
        <p className="text-sm font-semibold uppercase tracking-widest text-red-400">
          Free for everyone
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold leading-tight text-white">
          Install LinkShield in 2 minutes
        </h1>
        <p className="mt-4 text-lg text-zinc-400">
          Once installed, scam links in WhatsApp Web, Gmail, Telegram, Messenger,
          and Instagram are scanned automatically — and dangerous clicks are blocked.
        </p>

        <ol className="mt-10 space-y-6">
          <li className="rounded-2xl border border-white/10 bg-[#111] p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-400">
              Step 1
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">
              Download the extension
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Download the ready-to-install zip, unzip it, then load the folder
              in Chrome.
            </p>
            <a
              href="/linkshield-extension.zip"
              className="mt-4 inline-flex rounded-full bg-red-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-400"
            >
              Download LinkShield extension (.zip)
            </a>
          </li>

          <li className="rounded-2xl border border-white/10 bg-[#111] p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-400">
              Step 2
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">
              Load it in Chrome or Edge
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-zinc-400">
              <li>
                Open{" "}
                <code className="rounded bg-black px-1 text-xs text-zinc-300">
                  chrome://extensions
                </code>
              </li>
              <li>
                Turn on <strong className="text-zinc-200">Developer mode</strong>{" "}
                (top right)
              </li>
              <li>
                Click <strong className="text-zinc-200">Load unpacked</strong>
              </li>
              <li>
                Select the{" "}
                <code className="rounded bg-black px-1 text-xs text-zinc-300">
                  linkshield
                </code>{" "}
                folder
              </li>
            </ol>
          </li>

          <li className="rounded-2xl border border-white/10 bg-[#111] p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-400">
              Step 3
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">
              Point it at this site
            </h2>
            <InstallApiHint />
          </li>

          <li className="rounded-2xl border border-white/10 bg-[#111] p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-400">
              Step 4
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">
              Turn on notifications
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Open Protect and allow notifications so you get alerted the moment
              a scam link appears.
            </p>
            <Link
              href="/linkshield/protect"
              className="mt-4 inline-flex rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-zinc-100 hover:bg-white/10"
            >
              Open Protect →
            </Link>
          </li>
        </ol>

        <section className="mt-12 rounded-2xl border border-white/10 bg-black px-6 py-8">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-white">
            No extension? Use the web scanner
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Anyone can paste a suspicious link or message at{" "}
            <Link href="/linkshield" className="text-red-400 underline">
              /linkshield
            </Link>{" "}
            — free, no account required. Report scams to protect the community.
          </p>
        </section>
      </div>
    </main>
  );
}
