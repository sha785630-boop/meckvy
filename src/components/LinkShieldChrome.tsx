import Link from "next/link";
import type { ReactNode } from "react";

export function LinkShieldPoweredBy({ className = "" }: { className?: string }) {
  return (
    <p className={`text-center text-sm text-zinc-500 ${className}`}>
      LinkShield is powered by{" "}
      <Link href="/" className="font-medium text-zinc-300 underline-offset-2 hover:text-white hover:underline">
        Meckvy
      </Link>
    </p>
  );
}

export function LinkShieldHeader({
  subtitle,
  right,
}: {
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <header className="border-b border-white/10 bg-black px-6 py-4 text-zinc-100 md:px-10">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <div>
          <Link
            href="/linkshield"
            className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-white"
          >
            LinkShield
          </Link>
          {subtitle ? (
            <p className="text-sm text-zinc-500">{subtitle}</p>
          ) : (
            <p className="text-xs text-zinc-500">
              Powered by{" "}
              <Link href="/" className="text-zinc-400 hover:text-white">
                Meckvy
              </Link>
            </p>
          )}
        </div>
        {right}
      </div>
    </header>
  );
}
