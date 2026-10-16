"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { enableEnquiryAlerts, promptInstall, useAppEnv } from "@/lib/app-env";

function Step({
  n,
  done,
  title,
  children,
}: {
  n: number;
  done: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-foam p-6">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
            done ? "bg-lagoon text-foam" : "bg-lagoon-mist text-lagoon-deep"
          }`}
        >
          {done ? "✓" : n}
        </span>
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
      </div>
      <div className="mt-4 pl-12 text-sm text-ink-soft">{children}</div>
    </section>
  );
}

export default function GetTheAppPage() {
  const env = useAppEnv();
  const [qr, setQr] = useState("");
  const [busy, setBusy] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    void QRCode.toDataURL(`${window.location.origin}/dashboard`, {
      width: 360,
      margin: 1,
      color: { dark: "#084e51", light: "#ffffff" },
    }).then(setQr);
  }, []);

  async function turnOnAlerts() {
    setBusy(true);
    try {
      const res = await enableEnquiryAlerts();
      setAlertMsg({ ok: res.ok, text: res.message });
    } catch {
      setAlertMsg({ ok: false, text: "Could not turn on alerts — please try again." });
    } finally {
      setBusy(false);
    }
  }

  const alertsOn = env.permission === "granted" && alertMsg?.ok !== false;
  const iosNeedsInstall = env.ios && !env.standalone;

  return (
    <div className="mx-auto max-w-4xl">
      <header className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-lagoon to-lagoon-deep p-8 text-foam">
        <div className="animate-soft-pulse absolute -right-10 -top-10 h-48 w-48 rounded-full bg-coral/40 blur-2xl" />
        <div className="relative flex flex-wrap items-center gap-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/app-icon/192"
            alt="DirectStay app icon"
            className="animate-float-y h-20 w-20 rounded-[1.4rem] shadow-xl shadow-ink/30"
          />
          <div className="min-w-0 flex-1">
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold md:text-4xl">
              DirectStay on your phone
            </h1>
            <p className="mt-2 max-w-xl text-foam/85">
              One tap to open your inbox, and a ding the moment a guest sends an
              enquiry — so you reply before they message the next guesthouse.
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_17rem]">
        <div className="space-y-5">
          <Step n={1} done={env.standalone} title="Add DirectStay to your home screen">
            {env.standalone ? (
              <p>You’re using the DirectStay app. 🎉</p>
            ) : env.canPrompt ? (
              <div className="space-y-3">
                <p>Installs in seconds — no app store, always up to date.</p>
                <button
                  type="button"
                  onClick={() => void promptInstall()}
                  className="btn-lift rounded-full bg-lagoon px-6 py-3 text-sm font-semibold text-foam hover:bg-lagoon-deep"
                >
                  📲 Install DirectStay
                </button>
              </div>
            ) : env.ios ? (
              <ol className="space-y-3">
                <li className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sand text-base">
                    1
                  </span>
                  Open this page in <strong className="text-ink">Safari</strong>.
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sand">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-lagoon-deep" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 002 2h10a2 2 0 002-2v-6" />
                    </svg>
                  </span>
                  Tap the <strong className="text-ink">Share</strong> button at the bottom.
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sand text-base">
                    ＋
                  </span>
                  Choose <strong className="text-ink">Add to Home Screen</strong>, then{" "}
                  <strong className="text-ink">Add</strong>.
                </li>
              </ol>
            ) : (
              <div className="space-y-2">
                <p>
                  <strong className="text-ink">On Android:</strong> open this page in Chrome,
                  tap the ⋮ menu → <strong className="text-ink">Install app</strong>.
                </p>
                <p>
                  <strong className="text-ink">On iPhone:</strong> open in Safari, tap Share →{" "}
                  <strong className="text-ink">Add to Home Screen</strong>.
                </p>
                <p className="text-xs">On a computer? Scan the QR code with your phone.</p>
              </div>
            )}
          </Step>

          <Step n={2} done={alertsOn} title="Turn on enquiry alerts">
            {!env.ready ? null : !env.pushSupported && !iosNeedsInstall ? (
              <p>This browser can’t show notifications — try Chrome on Android or the installed app on iPhone.</p>
            ) : iosNeedsInstall ? (
              <p>
                On iPhone, alerts work once DirectStay is on your home screen. Finish step 1,
                open DirectStay from the new icon, then come back here.
              </p>
            ) : (
              <div className="space-y-3">
                <p>Get a notification for every new guest message — even when DirectStay is closed.</p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void turnOnAlerts()}
                  className="btn-lift rounded-full bg-coral px-6 py-3 text-sm font-semibold text-foam hover:brightness-110 disabled:opacity-60"
                >
                  {busy ? "Turning on…" : alertsOn ? "🔔 Send a test ding" : "🔔 Turn on alerts"}
                </button>
                {alertMsg && (
                  <p className={alertMsg.ok ? "text-lagoon-deep" : "text-coral"}>{alertMsg.text}</p>
                )}
              </div>
            )}
          </Step>

          <Step n={3} done={false} title="Reply from anywhere">
            <p>
              Open <strong className="text-ink">Inbox</strong>, pick a template, and your reply
              is translated into the guest’s language — on the beach, on the boat, anywhere.
            </p>
          </Step>
        </div>

        <aside className="rounded-2xl border border-line bg-foam p-6 text-center">
          <p className="text-sm font-semibold text-ink">Open on your phone</p>
          <p className="mt-1 text-xs text-ink-soft">Scan with your phone camera</p>
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="QR code to open DirectStay on your phone" className="mx-auto mt-4 w-48 rounded-xl" />
          ) : (
            <div className="mx-auto mt-4 h-48 w-48 animate-pulse rounded-xl bg-sand" />
          )}
          <p className="mt-4 text-xs text-ink-soft">
            Sign in with the same email, then add it to your home screen.
          </p>
        </aside>
      </div>
    </div>
  );
}
