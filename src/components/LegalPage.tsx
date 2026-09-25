import Link from "next/link";
import type { ReactNode } from "react";
import { CONTACT_EMAIL, CONTACT_PHONE } from "@/lib/site";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <main className="sand-glow min-h-screen">
      <header className="flex items-center justify-between border-b border-line/70 bg-foam/75 px-6 py-5 backdrop-blur-md md:px-10">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-xl font-semibold text-lagoon-deep"
        >
          Meckvy
        </Link>
        <Link href="/pricing" className="text-sm font-medium text-ink-soft hover:text-ink">
          Pricing
        </Link>
      </header>
      <article className="mx-auto max-w-2xl px-6 py-14 text-ink-soft md:px-0 [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ink [&_li]:mt-1.5 [&_p]:mt-3 [&_p]:leading-relaxed [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold text-ink">
          {title}
        </h1>
        <p className="text-sm">Last updated {updated}</p>
        {children}
        <h2>Contact</h2>
        <p>
          Questions about this page:{" "}
          {CONTACT_EMAIL ? (
            <a className="text-lagoon-deep underline" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
          ) : null}
          {CONTACT_EMAIL ? " · " : ""}
          {CONTACT_PHONE} (phone / WhatsApp), Maldives.
        </p>
      </article>
    </main>
  );
}
