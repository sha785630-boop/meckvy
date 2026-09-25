"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { CopyButton } from "@/components/CopyButton";

type Platform = {
  id: string;
  name: string;
  code: "script" | "iframe";
  steps: string[];
  note?: string;
};

const PLATFORMS: Platform[] = [
  {
    id: "wordpress",
    name: "WordPress",
    code: "script",
    steps: [
      "In your WordPress admin, go to Plugins → Add New and search “WPCode”.",
      "Install and activate the free WPCode plugin.",
      "Open Code Snippets → Header & Footer.",
      "Paste the code into the Footer box and press Save.",
    ],
  },
  {
    id: "wix",
    name: "Wix",
    code: "script",
    steps: [
      "In your Wix dashboard, open Settings → Custom Code (under Advanced).",
      "Click + Add Custom Code and paste the code.",
      "Choose “All pages” and place it in “Body – end”.",
      "Click Apply, then Publish your site.",
    ],
    note: "Custom Code needs a Wix Premium plan with your own domain. On a free plan, use Add → Embed Code → Embed HTML and paste the “inline form” code instead.",
  },
  {
    id: "squarespace",
    name: "Squarespace",
    code: "script",
    steps: [
      "Open Settings (or Website Tools) → Code Injection.",
      "Paste the code into the Footer box.",
      "Click Save.",
    ],
    note: "Code Injection is available on paid Squarespace plans.",
  },
  {
    id: "shopify",
    name: "Shopify",
    code: "script",
    steps: [
      "Go to Online Store → Themes.",
      "Next to your live theme, click ⋯ → Edit code.",
      "Open layout/theme.liquid.",
      "Paste the code just above </body> and click Save.",
    ],
  },
  {
    id: "google",
    name: "Google Sites",
    code: "iframe",
    steps: [
      "Open your site in Google Sites and pick the page (e.g. Contact).",
      "Click Insert → Embed → Embed code.",
      "Paste the inline form code, click Next → Insert.",
      "Resize the box so the whole form shows, then Publish.",
    ],
  },
  {
    id: "other",
    name: "Other / HTML",
    code: "script",
    steps: [
      "Open your website’s HTML (or ask whoever built it).",
      "Paste the code just before the closing </body> tag on every page.",
      "Save and upload. A “Message us” button appears bottom-right.",
    ],
  },
];

const SHARE_PLACES = [
  { title: "Instagram", detail: "Edit profile → Links → add your Meckvy link." },
  { title: "Facebook page", detail: "Edit page info → Website, or add a “Contact us” button with your link." },
  { title: "Google Maps", detail: "In your Google Business Profile, paste the link as your Website." },
  { title: "WhatsApp Business", detail: "Business profile → Website → paste your link." },
  { title: "Print the QR", detail: "Put it at reception, on menus, or on your boat transfer card." },
];

export function ConnectWebsite({
  guesthouseId,
  guesthouseName,
}: {
  guesthouseId: string;
  guesthouseName: string;
}) {
  const [origin, setOrigin] = useState("");
  const [qr, setQr] = useState("");
  const [platformId, setPlatformId] = useState("wordpress");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const pageUrl = origin ? `${origin}/widget/${guesthouseId}` : "";

  const scriptCode = `<script src="${origin}/embed.js" data-guesthouse="${guesthouseId}" data-base="${origin}" async></script>`;
  const iframeCode = `<iframe src="${pageUrl}?embed=1" title="Message ${guesthouseName}" style="width:100%;height:620px;border:0;border-radius:16px;"></iframe>`;

  useEffect(() => {
    if (!pageUrl) return;
    void QRCode.toDataURL(pageUrl, {
      width: 480,
      margin: 1,
      color: { dark: "#142526", light: "#ffffff" },
    }).then(setQr);
  }, [pageUrl]);

  const platform = PLATFORMS.find((p) => p.id === platformId) ?? PLATFORMS[0]!;
  const platformCode = platform.code === "iframe" ? iframeCode : scriptCode;

  const helperMessage = useMemo(
    () =>
      [
        `Hi! Please add our Meckvy guest-message button to the ${guesthouseName} website.`,
        "",
        "Paste this code just before </body> on every page:",
        scriptCode,
        "",
        "If the site can't run scripts, embed this instead:",
        iframeCode,
        "",
        `Test page: ${pageUrl}`,
      ].join("\n"),
    [guesthouseName, scriptCode, iframeCode, pageUrl],
  );

  return (
    <div className="space-y-8">
      {/* Option 1 — link + QR */}
      <section className="rounded-2xl border border-lagoon/30 bg-foam p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-lagoon-deep">
          Easiest · no website needed · 1 minute
        </p>
        <h2 className="mt-1 text-xl font-semibold text-ink">
          1. Share your Meckvy page
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          This is your own guest message page. Anyone who opens it can send you
          an enquiry — it lands straight in your Inbox.
        </p>

        <div className="mt-5 grid gap-6 md:grid-cols-[1fr_auto]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <code className="min-w-0 flex-1 break-all rounded-xl bg-sand px-3 py-2.5 text-sm text-ink">
                {pageUrl || "Loading…"}
              </code>
              <CopyButton text={pageUrl} label="Copy link" />
              <a
                href={pageUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-lift rounded-full border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-sand"
              >
                Open
              </a>
            </div>

            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {SHARE_PLACES.map((place) => (
                <li key={place.title} className="rounded-xl bg-sand/70 px-4 py-3">
                  <p className="text-sm font-semibold text-ink">{place.title}</p>
                  <p className="mt-0.5 text-xs text-ink-soft">{place.detail}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col items-center gap-3">
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qr}
                alt="QR code for your Meckvy page"
                className="h-44 w-44 rounded-xl border border-line bg-white p-2"
              />
            ) : (
              <div className="h-44 w-44 animate-pulse rounded-xl bg-sand" />
            )}
            {qr && (
              <a
                href={qr}
                download={`meckvy-qr-${guesthouseId}.png`}
                className="btn-lift rounded-full border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-sand"
              >
                Download QR
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Option 2 — website button */}
      <section className="rounded-2xl border border-line bg-foam p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Have a website? · about 5 minutes
        </p>
        <h2 className="mt-1 text-xl font-semibold text-ink">
          2. Add a “Message us” button to your website
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          Pick where your website is built, copy the code, follow the steps.
          No coding needed.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPlatformId(p.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                p.id === platformId
                  ? "bg-ink text-foam"
                  : "border border-line text-ink-soft hover:bg-sand"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <ol className="space-y-3">
            {platform.steps.map((step, i) => (
              <li key={step} className="flex gap-3 text-sm text-ink">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lagoon-mist text-xs font-semibold text-lagoon-deep">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
            {platform.note && (
              <li className="rounded-xl bg-sand/70 px-3 py-2 text-xs text-ink-soft">
                {platform.note}
              </li>
            )}
          </ol>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              {platform.code === "iframe" ? "Inline form code" : "Your code"}
            </p>
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-ink px-3 py-3 text-[11px] leading-relaxed text-foam">
              {platformCode}
            </pre>
            <div className="mt-3 flex flex-wrap gap-2">
              <CopyButton text={platformCode} label="Copy code" />
              {platform.code === "script" && (
                <CopyButton
                  text={iframeCode}
                  label="Copy inline form code"
                  className="!bg-foam !text-lagoon-deep border border-line"
                />
              )}
            </div>
          </div>
        </div>

        <p className="mt-6 text-xs text-ink-soft">
          Menu names can differ slightly between versions. Stuck? Use option 3 —
          it takes 30 seconds.
        </p>
      </section>

      {/* Option 3 — send to helper */}
      <section className="rounded-2xl border border-line bg-foam p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Someone else manages your site?
        </p>
        <h2 className="mt-1 text-xl font-semibold text-ink">
          3. Send the instructions to them
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          We write the message for you — code, steps, and a test link.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(helperMessage)}`}
            target="_blank"
            rel="noreferrer"
            className="btn-lift rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-95"
          >
            Send on WhatsApp
          </a>
          <a
            href={`mailto:?subject=${encodeURIComponent(
              `Add Meckvy to the ${guesthouseName} website`,
            )}&body=${encodeURIComponent(helperMessage)}`}
            className="btn-lift rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink hover:bg-sand"
          >
            Send by email
          </a>
          <CopyButton
            text={helperMessage}
            label="Copy message"
            className="!bg-foam !text-lagoon-deep border border-line"
          />
        </div>
      </section>

      {/* Test */}
      <section className="rounded-2xl border border-coral/30 bg-foam p-6">
        <h2 className="text-xl font-semibold text-ink">4. Test it</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Open your page, send yourself a message, then check your Inbox. If it
          arrives, you’re live.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={pageUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-lift rounded-full bg-coral px-5 py-2.5 text-sm font-semibold text-foam hover:brightness-110"
          >
            Send a test message
          </a>
          <a
            href="/dashboard/inbox"
            className="btn-lift rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink hover:bg-sand"
          >
            Check Inbox
          </a>
        </div>
      </section>
    </div>
  );
}
