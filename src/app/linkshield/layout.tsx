import type { Metadata } from "next";
import { LinkShieldPoweredBy } from "@/components/LinkShieldChrome";

export const metadata: Metadata = {
  title: "LinkShield — Phishing protection powered by Meckvy",
  description:
    "Free community phishing protection. Scan and block scam links. LinkShield is powered by Meckvy.",
};

export default function LinkShieldLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="linkshield flex min-h-screen flex-col">
      <div className="flex-1">{children}</div>
      <footer className="border-t border-white/10 px-6 py-8 md:px-10">
        <LinkShieldPoweredBy />
      </footer>
    </div>
  );
}
