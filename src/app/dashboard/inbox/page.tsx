"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GUESTHOUSE_DEFAULTS, LANGUAGES, TEMPLATES } from "@/lib/data";
import { fillTemplate } from "@/lib/translate";
import type { GuestMessage, LanguageCode } from "@/lib/types";

function channelBadge(channel: GuestMessage["channel"]) {
  return channel === "whatsapp"
    ? "bg-emerald-100 text-emerald-900"
    : "bg-sky-100 text-sky-900";
}

function statusLabel(status: GuestMessage["status"]) {
  return {
    unread: "Unread",
    read: "Read",
    replied: "Replied",
    automated: "Auto-replied",
  }[status];
}

export default function InboxPage() {
  const [messages, setMessages] = useState<GuestMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [targetLang, setTargetLang] = useState<LanguageCode>("en");
  const [preview, setPreview] = useState("");
  const [provider, setProvider] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/messages");
    const data = (await res.json()) as { messages: GuestMessage[] };
    setMessages(data.messages);
    setSelectedId((current) => current ?? data.messages[0]?.id ?? null);
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 8000);
    return () => window.clearInterval(id);
  }, [load]);

  const selected = useMemo(
    () => messages.find((m) => m.id === selectedId) ?? null,
    [messages, selectedId],
  );

  useEffect(() => {
    if (!selected) return;
    setTargetLang(selected.detectedLanguage);
    if (selected.status !== "unread") return;

    void fetch("/api/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected.id, status: "read" }),
    }).then(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === selected.id ? { ...m, status: "read" } : m,
        ),
      );
    });
  }, [selected]);

  async function translateDraft() {
    if (!draft.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: draft, from: "en", to: targetLang }),
      });
      const data = (await res.json()) as {
        translated?: string;
        provider?: string;
        error?: string;
      };
      if (data.translated) {
        setPreview(data.translated);
        setProvider(data.provider ?? "");
      } else {
        setToast(data.error ?? "Translation failed");
      }
    } finally {
      setBusy(false);
    }
  }

  function applyTemplate(templateId: string) {
    const tpl = TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    const filled = fillTemplate(tpl.body, {
      dates: "12–15 June",
      room_type: GUESTHOUSE_DEFAULTS.roomType,
      price: GUESTHOUSE_DEFAULTS.price,
      breakfast: GUESTHOUSE_DEFAULTS.breakfast,
      duration: GUESTHOUSE_DEFAULTS.transferDuration,
      transfer_price: GUESTHOUSE_DEFAULTS.transferPrice,
      private_price: GUESTHOUSE_DEFAULTS.privatePrice,
      checkin_time: GUESTHOUSE_DEFAULTS.checkinTime,
      guesthouse_name: GUESTHOUSE_DEFAULTS.name,
      island: GUESTHOUSE_DEFAULTS.island,
      dinner_time: GUESTHOUSE_DEFAULTS.dinnerTime,
      breakfast_hours: GUESTHOUSE_DEFAULTS.breakfastHours,
      dinner_end: GUESTHOUSE_DEFAULTS.dinnerEnd,
      checkout_time: GUESTHOUSE_DEFAULTS.checkoutTime,
    });
    setDraft(filled);
    setPreview("");
  }

  async function sendReply() {
    if (!selected || !draft.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: selected.threadId,
          channel: selected.channel,
          to: selected.guestContact,
          subject: selected.subject,
          text: draft,
          fromLang: "en",
          toLang: targetLang,
          translate: targetLang !== "en",
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        deliveredAs?: string;
        delivery?: { note?: string };
        error?: string;
      };
      if (data.ok) {
        setToast(data.delivery?.note ?? "Message sent");
        setDraft("");
        setPreview(data.deliveredAs ?? "");
        await load();
      } else {
        setToast(data.error ?? "Send failed");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row lg:gap-6">
      <div className="lg:w-80 lg:shrink-0">
        <header className="mb-4">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">
            Inbox
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            WhatsApp + Email · auto-translated previews
          </p>
        </header>
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-foam">
          {messages.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => setSelectedId(m.id)}
                className={`w-full px-4 py-3 text-left transition hover:bg-sand/80 ${
                  selectedId === m.id ? "bg-sand" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${channelBadge(m.channel)}`}
                  >
                    {m.channel}
                  </span>
                  {m.status === "unread" && (
                    <span className="h-2 w-2 rounded-full bg-coral" />
                  )}
                  <span className="ml-auto text-[10px] text-ink-soft">
                    {statusLabel(m.status)}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm font-semibold text-ink">
                  {m.guestName}
                </p>
                <p className="truncate text-xs text-ink-soft">
                  {m.translatedPreview ?? m.body}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="min-w-0 flex-1 rounded-2xl border border-line bg-foam p-5 md:p-6">
        {!selected ? (
          <p className="text-ink-soft">Select a conversation</p>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
              <div>
                <h2 className="text-xl font-semibold text-ink">
                  {selected.guestName}
                </h2>
                <p className="text-sm text-ink-soft">{selected.guestContact}</p>
                {selected.subject && (
                  <p className="mt-1 text-sm font-medium text-lagoon-deep">
                    {selected.subject}
                  </p>
                )}
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${channelBadge(selected.channel)}`}
              >
                {selected.channel}
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  Original (
                  {LANGUAGES.find((l) => l.code === selected.detectedLanguage)
                    ?.label ?? selected.detectedLanguage}
                  )
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">
                  {selected.body}
                </p>
              </div>
              {selected.translatedPreview &&
                selected.detectedLanguage !== "en" && (
                  <div className="rounded-xl bg-sand px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-lagoon-deep">
                      English preview
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
                      {selected.translatedPreview}
                    </p>
                  </div>
                )}
            </div>

            <div className="mt-6 border-t border-line pt-5">
              <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Insert template
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => applyTemplate(t.id)}
                    className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-lagoon hover:text-lagoon-deep"
                  >
                    {t.name}
                  </button>
                ))}
              </div>

              <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Your reply (English)
              </label>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={6}
                className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-3 text-sm text-ink outline-none ring-lagoon focus:ring-2"
                placeholder="Write your reply in English…"
              />

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="text-sm text-ink-soft">
                  Send in{" "}
                  <select
                    value={targetLang}
                    onChange={(e) =>
                      setTargetLang(e.target.value as LanguageCode)
                    }
                    className="ml-1 rounded-lg border border-line bg-white px-2 py-1.5 text-sm text-ink"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  disabled={busy || !draft.trim()}
                  onClick={() => void translateDraft()}
                  className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-sand disabled:opacity-50"
                >
                  Preview translation
                </button>
                <button
                  type="button"
                  disabled={busy || !draft.trim()}
                  onClick={() => void sendReply()}
                  className="rounded-full bg-lagoon px-5 py-2 text-sm font-semibold text-foam hover:bg-lagoon-deep disabled:opacity-50"
                >
                  Send via {selected.channel === "whatsapp" ? "WhatsApp" : "Email"}
                </button>
              </div>

              {preview && (
                <div className="mt-4 rounded-xl border border-lagoon/30 bg-lagoon-mist/40 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-lagoon-deep">
                    Guest will receive
                    {provider ? ` · ${provider}` : ""}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-ink">
                    {preview}
                  </p>
                </div>
              )}
              {toast && (
                <p className="mt-3 text-sm text-coral" role="status">
                  {toast}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
