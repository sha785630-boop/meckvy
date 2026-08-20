"use client";

import { useCallback, useEffect, useState } from "react";

type Status = {
  configured: boolean;
  phoneNumberIdSet: boolean;
  verifyToken: string;
  webhookPath: string;
  graphApi: string;
  hint: string;
};

type EmailStatus = {
  configured: boolean;
  from: string;
  webhookPath: string;
  hint: string;
};

type GoLiveCheck = {
  id: string;
  label: string;
  ready: boolean;
  action: string;
};

type GoLiveStatus = {
  checks: GoLiveCheck[];
  readyCount: number;
  requiredCount: number;
  webhookWhatsApp: string;
  webhookStripe: string;
  widgetPath?: string;
  guesthouseId: string;
};

export default function SettingsPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [emailStatus, setEmailStatus] = useState<EmailStatus | null>(null);
  const [goLive, setGoLive] = useState<GoLiveStatus | null>(null);
  const [origin, setOrigin] = useState("");
  const [testTo, setTestTo] = useState("");
  const [testText, setTestText] = useState(
    "Assalamu alaikum — Meckvy WhatsApp is connected to your guesthouse.",
  );
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("Meckvy email test");
  const [emailText, setEmailText] = useState(
    "Assalamu alaikum — Meckvy email is connected to your guesthouse.",
  );
  const [busy, setBusy] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [savingNumber, setSavingNumber] = useState(false);
  const [savedNumber, setSavedNumber] = useState("");
  const [numberDraft, setNumberDraft] = useState("");
  const [numberMessage, setNumberMessage] = useState("");
  const [message, setMessage] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  const refresh = useCallback(async () => {
    const [wa, em, live, gh] = await Promise.all([
      fetch("/api/whatsapp/status").then((r) => r.json() as Promise<Status>),
      fetch("/api/email/status").then((r) => r.json() as Promise<EmailStatus>),
      fetch("/api/golive/status").then((r) => r.json() as Promise<GoLiveStatus>),
      fetch("/api/guesthouse").then((r) =>
        r.json() as Promise<{ whatsappNumber?: string }>,
      ),
    ]);
    setStatus(wa);
    setEmailStatus(em);
    if ("checks" in live) setGoLive(live);
    if (gh.whatsappNumber) {
      setSavedNumber(gh.whatsappNumber);
      setNumberDraft(gh.whatsappNumber);
      setTestTo((current) => current || gh.whatsappNumber || "");
    }
  }, []);

  useEffect(() => {
    setOrigin(window.location.origin);
    void refresh();
  }, [refresh]);

  const webhookUrl = origin
    ? `${origin}${status?.webhookPath ?? "/api/whatsapp/webhook"}`
    : status?.webhookPath ?? "/api/whatsapp/webhook";

  const emailWebhookUrl = origin
    ? `${origin}${emailStatus?.webhookPath ?? "/api/email/webhook"}`
    : emailStatus?.webhookPath ?? "/api/email/webhook";

  async function saveNumber() {
    setSavingNumber(true);
    setNumberMessage("");
    try {
      const res = await fetch("/api/guesthouse", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsappNumber: numberDraft }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        whatsappNumber?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setNumberMessage(data.error ?? "Could not save number");
        return;
      }
      setSavedNumber(data.whatsappNumber ?? "");
      setTestTo(data.whatsappNumber ?? "");
      setNumberMessage("WhatsApp number saved.");
    } finally {
      setSavingNumber(false);
    }
  }

  async function sendTest() {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/whatsapp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testTo, text: testText }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        messageId?: string;
        note?: string;
      };
      if (data.ok) {
        setMessage(
          data.note
            ? `${data.note}${data.messageId ? ` · id ${data.messageId}` : ""}`
            : "Sent",
        );
      } else {
        setMessage(data.error ?? "Test failed");
      }
    } finally {
      setBusy(false);
    }
  }

  async function sendEmailTest() {
    setEmailBusy(true);
    setEmailMessage("");
    try {
      const res = await fetch("/api/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: emailTo,
          subject: emailSubject,
          text: emailText,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        id?: string;
        note?: string;
      };
      if (data.ok) {
        setEmailMessage(
          data.note
            ? `${data.note}${data.id ? ` · id ${data.id}` : ""}`
            : "Sent",
        );
      } else {
        setEmailMessage(data.error ?? "Test failed");
      }
    } finally {
      setEmailBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">
          Settings
        </h1>
        <p className="mt-1 text-ink-soft">
          Put the website widget on the guesthouse site — guest messages land in
          Inbox. WhatsApp and email APIs are optional later.
        </p>
      </header>

      {goLive && (
        <section className="mb-6 rounded-2xl border border-lagoon/30 bg-foam p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-lagoon-deep">
            Main guest channel
          </p>
          <h2 className="mt-1 text-lg font-semibold text-ink">Website widget</h2>
          <p className="mt-2 text-sm text-ink-soft">
            1) Paste the snippet on their website · 2) Guest sends an inquiry ·
            3) You reply in{" "}
            <a href="/dashboard/inbox" className="font-medium text-lagoon-deep underline">
              Inbox
            </a>
            .
          </p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Direct page link (share or QR)
          </p>
          <code className="mt-1 block break-all rounded-xl bg-sand px-3 py-2 text-xs text-ink">
            {origin}/widget/{goLive.guesthouseId}
          </code>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Paste this before &lt;/body&gt; on their website
          </p>
          <pre className="mt-1 overflow-x-auto rounded-xl bg-ink px-3 py-3 text-[11px] leading-relaxed text-foam">
{`<script
  src="${origin}/embed.js"
  data-guesthouse="${goLive.guesthouseId}"
  data-base="${origin}"
  async
></script>`}
          </pre>
          <p className="mt-3 text-xs text-ink-soft">
            Or embed with iframe:
          </p>
          <pre className="mt-1 overflow-x-auto rounded-xl bg-ink px-3 py-3 text-[11px] leading-relaxed text-foam">
{`<iframe
  src="${origin}/widget/${goLive.guesthouseId}?embed=1"
  title="Contact"
  style="width:100%;height:560px;border:0;border-radius:16px;"
></iframe>`}
          </pre>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={`/widget/${goLive.guesthouseId}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-full bg-lagoon px-4 py-2 text-sm font-semibold text-foam hover:bg-lagoon-deep"
            >
              Open widget preview
            </a>
            <a
              href="/dashboard/inbox"
              className="inline-flex rounded-full border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-sand"
            >
              Open inbox
            </a>
          </div>
        </section>
      )}

      {goLive && (
        <section className="mb-6 rounded-2xl border border-line bg-foam p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-ink">Go-live checklist</h2>
            <span className="text-sm text-ink-soft">
              {goLive.readyCount}/{goLive.requiredCount} required ready
            </span>
          </div>
          <p className="mt-2 text-xs text-ink-soft">
            Required items unlock demos for customers. WhatsApp / Stripe / email
            keys are optional.
          </p>
          <ul className="mt-4 space-y-3">
            {goLive.checks.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-start justify-between gap-2 border-t border-line pt-3 first:border-t-0 first:pt-0"
              >
                <div>
                  <p className="text-sm font-medium text-ink">{c.label}</p>
                  <p className="mt-0.5 break-all text-xs text-ink-soft">
                    {c.action}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    c.ready
                      ? "bg-emerald-100 text-emerald-900"
                      : "bg-sand text-ink-soft"
                  }`}
                >
                  {c.ready ? "Ready" : "Todo"}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-1 text-xs text-ink-soft">
            <p>
              Your guesthouse id:{" "}
              <code className="rounded bg-sand px-1">{goLive.guesthouseId}</code>
            </p>
            <p>
              Stripe webhook (when billing):{" "}
              <code className="break-all rounded bg-sand px-1">
                {goLive.webhookStripe}
              </code>
            </p>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-line bg-foam p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Optional later
            </p>
            <h2 className="text-lg font-semibold text-ink">WhatsApp Cloud API</h2>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              status?.configured
                ? "bg-emerald-100 text-emerald-900"
                : "bg-sand text-ink-soft"
            }`}
          >
            {status?.configured ? "Credentials loaded" : "Not needed for widget"}
          </span>
        </div>
        <p className="mt-2 text-sm text-ink-soft">
          Skip this until Meta developer signup works. The website widget already
          delivers guest messages to Inbox.
        </p>
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-lagoon-deep">
            Show WhatsApp setup (Meta)
          </summary>
          <p className="mt-2 text-sm text-ink-soft">{status?.hint}</p>

        <div className="mt-5 rounded-xl border border-lagoon/25 bg-lagoon-mist/30 px-4 py-4">
          <h3 className="text-sm font-semibold text-ink">Your WhatsApp number</h3>
          <p className="mt-1 text-xs text-ink-soft">
            This is the phone that should receive test messages. Maldives: start
            with 960, no spaces — e.g. 9607XXXXXXX.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              value={numberDraft}
              onChange={(e) => setNumberDraft(e.target.value)}
              placeholder="9607XXXXXXX"
              inputMode="tel"
              className="min-w-[220px] flex-1 rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none ring-lagoon focus:ring-2"
            />
            <button
              type="button"
              disabled={savingNumber || !numberDraft.trim()}
              onClick={() => void saveNumber()}
              className="rounded-full bg-lagoon px-5 py-2.5 text-sm font-semibold text-foam hover:bg-lagoon-deep disabled:opacity-50"
            >
              {savingNumber ? "Saving…" : "Save number"}
            </button>
          </div>
          {savedNumber && (
            <p className="mt-2 text-xs text-lagoon-deep">Saved: {savedNumber}</p>
          )}
          {numberMessage && (
            <p className="mt-2 text-xs text-coral" role="status">
              {numberMessage}
            </p>
          )}
        </div>

        <div className="mt-5 rounded-xl bg-sand px-4 py-4 text-sm text-ink-soft">
          <p className="font-semibold text-ink">Two different “numbers” — don’t mix them</p>
          <ul className="mt-3 space-y-3">
            <li>
              <span className="font-medium text-ink">1. Your guesthouse WhatsApp (Business)</span>
              <br />
              You do <em>not</em> paste the normal phone like{" "}
              <code className="text-xs">+960 7xx xxxx</code> into Meckvy.
              Meta gives you a long{" "}
              <span className="font-medium text-ink">Phone number ID</span> (digits
              only, looks like <code className="text-xs">1098…</code>). That goes in{" "}
              <code className="text-xs">.env.local</code> as{" "}
              <code className="text-xs">WHATSAPP_PHONE_NUMBER_ID</code>.
            </li>
            <li>
              <span className="font-medium text-ink">2. Guest / your phone (to receive a test)</span>
              <br />
              In the test box below, type the phone that should <em>receive</em> the
              message — country code, no spaces. Maldives example:{" "}
              <code className="text-xs">9607XXXXXXX</code> (not{" "}
              <code className="text-xs">7XXXXXXX</code> alone).
            </li>
          </ul>
        </div>

        <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm text-ink-soft">
          <li>
            Open{" "}
            <a
              className="text-lagoon-deep underline"
              href="https://developers.facebook.com/"
              target="_blank"
              rel="noreferrer"
            >
              developers.facebook.com
            </a>{" "}
            → create an app → add the{" "}
            <span className="font-medium text-ink">WhatsApp</span> product.
          </li>
          <li>
            Go to <span className="font-medium text-ink">WhatsApp → API Setup</span>.
            Copy <span className="font-medium text-ink">Temporary access token</span>{" "}
            and <span className="font-medium text-ink">Phone number ID</span> (under
            “From”).
          </li>
          <li>
            Create a file{" "}
            <code className="rounded bg-sand px-1.5 py-0.5 text-xs">
              .env.local
            </code>{" "}
            in the Meckvy folder and paste the values (see box below), then restart{" "}
            <code className="text-xs">npm run dev</code>.
          </li>
          <li>
            For receiving guest messages: run{" "}
            <code className="rounded bg-sand px-1.5 py-0.5 text-xs">
              ngrok http 3000
            </code>{" "}
            and set Meta webhook to that HTTPS URL +{" "}
            <code className="text-xs">/api/whatsapp/webhook</code>.
          </li>
        </ol>

        <pre className="mt-4 overflow-x-auto rounded-xl bg-ink px-4 py-3 text-xs text-foam">
{`# Example — replace with YOUR values from Meta API Setup
WHATSAPP_TOKEN=EAAB...paste_token_here
WHATSAPP_PHONE_NUMBER_ID=109876543210987
WHATSAPP_VERIFY_TOKEN=${status?.verifyToken ?? "meckvy_verify"}`}
        </pre>

        <div className="mt-4 space-y-2 text-sm">
          <p>
            <span className="font-medium text-ink">Webhook URL</span>
            <br />
            <code className="mt-1 inline-block break-all rounded bg-sand px-2 py-1 text-xs">
              {webhookUrl}
            </code>
          </p>
          <p>
            <span className="font-medium text-ink">Verify token</span>
            <br />
            <code className="mt-1 inline-block rounded bg-sand px-2 py-1 text-xs">
              {status?.verifyToken ?? "meckvy_verify"}
            </code>
          </p>
        </div>

        <div className="mt-6 border-t border-line pt-5">
          <h3 className="text-sm font-semibold text-ink">Send a test message</h3>
          <p className="mt-1 text-xs text-ink-soft">
            This is the <span className="font-medium text-ink">guest’s phone</span>{" "}
            (or your personal phone), not the Phone number ID. First send any
            WhatsApp message <em>to</em> the Meta test Business number from that
            phone, then paste it here with country code.
          </p>
          <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Guest phone (who receives the test)
          </label>
          <input
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
            placeholder="9607XXXXXXX"
            inputMode="tel"
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none ring-lagoon focus:ring-2"
          />
          <p className="mt-1 text-xs text-ink-soft">
            Maldives: start with <code>960</code> then the mobile number. Example
            if your phone is 7XX-XXXX: type <code>9607XXXXXXX</code>.
          </p>
          <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Message
          </label>
          <textarea
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none ring-lagoon focus:ring-2"
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={busy || !testTo.trim()}
              onClick={() => void sendTest()}
              className="rounded-full bg-lagoon px-5 py-2.5 text-sm font-semibold text-foam hover:bg-lagoon-deep disabled:opacity-50"
            >
              {busy ? "Sending…" : "Send test via WhatsApp"}
            </button>
            <button
              type="button"
              onClick={() => void refresh()}
              className="rounded-full border border-line px-4 py-2.5 text-sm font-medium text-ink-soft hover:bg-sand"
            >
              Refresh status
            </button>
          </div>
          {message && (
            <p className="mt-3 text-sm text-coral" role="status">
              {message}
            </p>
          )}
        </div>
        </details>
      </section>

      <section className="mt-4 rounded-2xl border border-line bg-foam p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Optional — for emailing guests back
            </p>
            <h2 className="text-lg font-semibold text-ink">Email (Resend)</h2>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              emailStatus?.configured
                ? "bg-emerald-100 text-emerald-900"
                : "bg-sand text-ink-soft"
            }`}
          >
            {emailStatus?.configured ? "Credentials loaded" : "Demo replies OK"}
          </span>
        </div>
        <p className="mt-2 text-sm text-ink-soft">
          Without Resend, inbox replies still save (demo). Add keys when you want
          real emails to website guests.
        </p>
        <p className="mt-2 text-sm text-ink-soft">{emailStatus?.hint}</p>

        <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm text-ink-soft">
          <li>
            Create an account at{" "}
            <a
              href="https://resend.com"
              target="_blank"
              rel="noreferrer"
              className="text-lagoon-deep underline"
            >
              resend.com
            </a>{" "}
            and copy an API key.
          </li>
          <li>
            Add a domain (or use Resend’s test sender{" "}
            <code className="text-xs">onboarding@resend.dev</code> — only sends
            to your own signup email).
          </li>
          <li>
            Put keys in{" "}
            <code className="rounded bg-sand px-1.5 py-0.5 text-xs">
              .env.local
            </code>{" "}
            and restart the server.
          </li>
          <li>
            For inbound mail: Resend → Webhooks →{" "}
            <code className="text-xs">email.received</code> → URL below (needs
            HTTPS / ngrok).
          </li>
        </ol>

        <pre className="mt-4 overflow-x-auto rounded-xl bg-ink px-4 py-3 text-xs text-foam">
{`RESEND_API_KEY=re_xxxxxxxxx
EMAIL_FROM="Lagoon Pearl <stay@yourdomain.com>"`}
        </pre>

        <div className="mt-4 space-y-2 text-sm">
          <p>
            <span className="font-medium text-ink">From address</span>
            <br />
            <code className="mt-1 inline-block break-all rounded bg-sand px-2 py-1 text-xs">
              {emailStatus?.from ?? "—"}
            </code>
          </p>
          <p>
            <span className="font-medium text-ink">Inbound webhook</span>
            <br />
            <code className="mt-1 inline-block break-all rounded bg-sand px-2 py-1 text-xs">
              {emailWebhookUrl}
            </code>
          </p>
        </div>

        <div className="mt-6 border-t border-line pt-5">
          <h3 className="text-sm font-semibold text-ink">Send a test email</h3>
          <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
            To
          </label>
          <input
            value={emailTo}
            onChange={(e) => setEmailTo(e.target.value)}
            placeholder="you@email.com"
            type="email"
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none ring-lagoon focus:ring-2"
          />
          <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Subject
          </label>
          <input
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none ring-lagoon focus:ring-2"
          />
          <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Message
          </label>
          <textarea
            value={emailText}
            onChange={(e) => setEmailText(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none ring-lagoon focus:ring-2"
          />
          <button
            type="button"
            disabled={emailBusy || !emailTo.trim()}
            onClick={() => void sendEmailTest()}
            className="mt-3 rounded-full bg-lagoon px-5 py-2.5 text-sm font-semibold text-foam hover:bg-lagoon-deep disabled:opacity-50"
          >
            {emailBusy ? "Sending…" : "Send test via Email"}
          </button>
          {emailMessage && (
            <p className="mt-3 text-sm text-coral" role="status">
              {emailMessage}
            </p>
          )}
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-line bg-foam p-6">
        <h2 className="text-lg font-semibold text-ink">Translation</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Inbox replies translate on send for website, email, and WhatsApp when
          you pick the guest language.
        </p>
      </section>
    </div>
  );
}
