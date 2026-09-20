import type { Metadata } from "next";
import Link from "next/link";
import ShieldProtect from "@/components/ShieldProtect";

export const metadata: Metadata = {
  title: "LinkShield Protect — Auto-detect scam links",
  description:
    "Connect WhatsApp, Gmail, and Telegram. Get instant alerts when someone sends a phishing link.",
};

export default function ShieldProtectPage() {
  return (
    <main className="min-h-screen bg-foam">
      <header className="border-b border-line bg-ink px-6 py-4 text-foam md:px-10">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <p className="font-[family-name:var(--font-display)] text-xl font-semibold">
              LinkShield Protect
            </p>
            <p className="text-sm text-foam/70">Automatic scam link alerts</p>
          </div>
          <Link href="/shield" className="text-sm text-foam/70 hover:text-foam">
            Manual scan →
          </Link>
        </div>
      </header>

      <div className="px-6 py-10 md:px-10">
        <ShieldProtect />
      </div>
    </main>
  );
}
