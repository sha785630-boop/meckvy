import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["SOFT", "opsz"],
});

const body = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Meckvy — Guesthouse automation for the Maldives",
  description:
    "Save hours every day. Meckvy automates WhatsApp & email for Maldivian guesthouses — with instant guest-language translation.",
  openGraph: {
    title: "Meckvy — Guesthouse automation for the Maldives",
    description:
      "WhatsApp & email on autopilot for Maldivian guesthouses, with translation.",
    images: [{ url: "/redhan.jpeg", width: 1200, height: 630, alt: "Meckvy" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans text-ink">
        {children}
      </body>
    </html>
  );
}
