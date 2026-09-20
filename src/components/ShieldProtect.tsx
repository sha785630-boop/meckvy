"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Alert = {
  id: string;
  platform: string;
  senderHint: string | null;
  messagePreview: string | null;
  url: string;
  risk: "safe" | "suspicious" | "dangerous";
  score: string;
  flags: { title: string; detail: string }[];
  read: boolean;
  createdAt: string;
};

type Connection = {
  platform: string;
  status: string;
  connectedAt: string;
};

const PLATFORM_LABELS: Record<string, string> = {
  whatsapp_web: "WhatsApp Web",
  telegram_web: "Telegram Web",
  gmail: "Gmail",
  messenger: "Facebook Messenger",
  instagram: "Instagram DMs",
  sms_android: "SMS (Android)",
  email_imap: "Email inbox",
};

const CLIENT_KEY = "linkshield_client_id";

function getClientId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(CLIENT_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(CLIENT_KEY, id);
  }
  return id;
}

const RISK_STYLE = {
  dangerous: "border-red-500/30 bg-red-500/10",
  suspicious: "border-amber-500/30 bg-amber-500/10",
  safe: "border-emerald-500/30 bg-emerald-500/10",
};

export default function ShieldProtect() {
  const [clientId, setClientId] = useState("");
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (id: string) => {
    const res = await fetch(`/api/shield/alerts?clientId=${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setAlerts(data.alerts ?? []);
    setConnections(data.connections ?? []);
  }, []);

  useEffect(() => {
    const id = getClientId();
    setClientId(id);
    refresh(id).finally(() => setLoading(false));

    fetch("/api/shield/client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: id }),
    }).catch(() => {});

    const interval = setInterval(() => refresh(id), 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  async function enablePush() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      alert("Push notifications are not supported in this browser.");
      return;
    }

    const perm = await Notification.requestPermission();
    if (perm !== "granted") return;

    const reg = await navigator.serviceWorker.register("/shield-sw.js");
    const keyRes = await fetch("/api/shield/push");
    const { publicKey } = await keyRes.json();
    if (!publicKey) {
      alert("Push not configured on server.");
      return;
    }

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    const json = sub.toJSON();
    await fetch("/api/shield/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        subscription: {
          endpoint: json.endpoint,
          keys: json.keys,
        },
      }),
    });

    setPushEnabled(true);
  }

  async function markRead(alertId: string) {
    await fetch("/api/shield/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, alertId }),
    });
    refresh(clientId);
  }

  const unread = alerts.filter((a) => !a.read && a.risk !== "safe");

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <section className="rounded-2xl border border-white/10 bg-[#111] p-6">
        <h2 className="text-lg font-semibold text-white">Automatic protection</h2>
        <p className="mt-2 text-sm text-zinc-500">
          Install the LinkShield browser extension. When someone sends you a
          link on WhatsApp Web, Gmail, or Telegram, you get an instant warning —
          no forwarding needed.
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-zinc-400">
          <li>
            Go to{" "}
            <Link href="/linkshield/install" className="text-red-400 underline">
              /linkshield/install
            </Link>{" "}
            and download the extension
          </li>
          <li>Enable Developer mode in Chrome → Load unpacked</li>
          <li>Open WhatsApp Web or Gmail — links are scanned automatically</li>
        </ol>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={enablePush}
            className="rounded-full bg-red-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-400"
          >
            {pushEnabled
              ? "Push enabled ✓"
              : "Enable phone/desktop notifications"}
          </button>
        </div>
        <p className="mt-3 font-mono text-xs text-zinc-600">
          Device ID: {clientId}
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Connected apps</h2>
        {connections.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">
            No apps connected yet. Install the extension and open WhatsApp Web
            or Gmail.
          </p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {connections.map((c) => (
              <li
                key={c.platform}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-medium text-zinc-200"
              >
                {PLATFORM_LABELS[c.platform] ?? c.platform} ✓
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">
          Alerts {unread.length > 0 && `(${unread.length} new)`}
        </h2>
        {loading ? (
          <p className="mt-4 text-sm text-zinc-500">Loading…</p>
        ) : alerts.length === 0 ? (
          <p className="mt-4 rounded-xl border border-white/10 bg-[#111] p-6 text-sm text-zinc-500">
            No alerts yet. When a suspicious link arrives in a connected app, it
            will show here.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {alerts.map((a) => (
              <li
                key={a.id}
                className={`rounded-2xl border p-4 ${RISK_STYLE[a.risk]} ${!a.read && a.risk !== "safe" ? "ring-2 ring-red-500/40" : ""}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-zinc-100">
                      {a.risk === "dangerous"
                        ? "🚨 Scam link"
                        : a.risk === "suspicious"
                          ? "⚠️ Suspicious"
                          : "✅ Safe"}
                      {" · "}
                      {PLATFORM_LABELS[a.platform] ?? a.platform}
                    </p>
                    {a.senderHint && (
                      <p className="text-sm text-zinc-500">
                        From: {a.senderHint}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-zinc-600">
                    {new Date(a.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-2 truncate font-mono text-xs text-zinc-400">
                  {a.url}
                </p>
                {a.flags?.[0] && (
                  <p className="mt-2 text-sm text-zinc-400">
                    {a.flags[0].detail}
                  </p>
                )}
                {!a.read && a.risk !== "safe" && (
                  <button
                    type="button"
                    onClick={() => markRead(a.id)}
                    className="mt-3 text-xs font-medium text-red-400 underline"
                  >
                    Mark as read
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#111] p-6">
        <h2 className="text-lg font-semibold text-white">
          Mobile apps (coming soon)
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          On Android, LinkShield can watch SMS and app notifications
          automatically. On iPhone, Apple restricts this — use the browser
          extension on web apps or share links to LinkShield.
        </p>
      </section>
    </div>
  );
}

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
