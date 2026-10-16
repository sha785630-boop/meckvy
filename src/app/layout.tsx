import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { AppRuntime } from "@/components/AppRuntime";
import { BRAND } from "@/lib/brand";
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
  title: `${BRAND.product} — Guesthouse inbox by ${BRAND.company}`,
  description: BRAND.description,
  openGraph: {
    title: `${BRAND.product} by ${BRAND.company}`,
    description: BRAND.description,
    images: [{ url: "/redhan.jpeg", width: 1200, height: 630, alt: BRAND.product }],
  },
  applicationName: BRAND.product,
  appleWebApp: {
    capable: true,
    title: BRAND.product,
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d6b6e",
  viewportFit: "cover",
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
        <AppRuntime />
        {children}
      </body>
    </html>
  );
}
