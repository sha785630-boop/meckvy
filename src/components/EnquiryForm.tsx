"use client";

import { useEffect, useMemo, useState } from "react";
import type { Room } from "@/lib/profile";

export const ROOM_EVENT = "meckvy:pick-room";

type Props = {
  guesthouseId: string;
  guesthouseName: string;
  rooms: Room[];
  replyTime: string;
  whatsapp?: string;
  compact?: boolean;
};

const inputClass =
  "mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none ring-lagoon transition focus:ring-2";

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function EnquiryForm({
  guesthouseId,
  guesthouseName,
  rooms,
  replyTime,
  whatsapp,
  compact = false,
}: Props) {
  const [form, setForm] = useState({
    checkIn: "",
    checkOut: "",
    guests: "2",
    room: "",
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState<null | typeof form>(null);
  const [today] = useState(() => isoDate(new Date()));

  useEffect(() => {
    function onPick(e: Event) {
      const room = (e as CustomEvent<string>).detail;
      setForm((f) => ({ ...f, room }));
      setSent(null);
    }
    window.addEventListener(ROOM_EVENT, onPick);
    return () => window.removeEventListener(ROOM_EVENT, onPick);
  }, []);

  const set =
    (key: keyof typeof form) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const nights = useMemo(() => {
    if (!form.checkIn || !form.checkOut) return 0;
    const n = Math.round(
      (Date.parse(form.checkOut) - Date.parse(form.checkIn)) / 86_400_000,
    );
    return n > 0 ? n : 0;
  }, [form.checkIn, form.checkOut]);

  const selectedRoom = rooms.find((r) => r.name === form.room);
  const estimate =
    selectedRoom && selectedRoom.price > 0 && nights > 0
      ? selectedRoom.price * nights
      : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.checkIn && form.checkOut && nights === 0) {
      setError("Check-out must be after check-in.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/public/guesthouse/${guesthouseId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          message:
            form.message.trim() ||
            `Hi! I'd like to check availability${form.room ? ` for the ${form.room}` : ""}.`,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not send — please try again.");
        return;
      }
      setSent(form);
      setForm((f) => ({ ...f, message: "" }));
    } catch {
      setError("Could not send — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    const waText = encodeURIComponent(
      `Hi ${guesthouseName}! I just sent an enquiry from your website${sent.checkIn ? ` for ${sent.checkIn} → ${sent.checkOut}` : ""}. My name is ${sent.name}.`,
    );
    return (
      <div className="animate-fade-up text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-lagoon text-2xl text-foam">
          ✓
        </div>
        <h3 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-semibold text-ink">
          Enquiry sent!
        </h3>
        <p className="mt-2 text-sm text-ink-soft">
          {guesthouseName} usually replies <strong>{replyTime}</strong>. Watch
          your inbox at <strong>{sent.email}</strong>.
        </p>
        {(sent.checkIn || sent.room) && (
          <div className="mt-4 rounded-xl bg-sand px-4 py-3 text-left text-sm text-ink-soft">
            {sent.checkIn && sent.checkOut && (
              <p>
                📅 {sent.checkIn} → {sent.checkOut}
              </p>
            )}
            <p>👥 {sent.guests} guest{sent.guests === "1" ? "" : "s"}</p>
            {sent.room && <p>🛏️ {sent.room}</p>}
          </div>
        )}
        <div className="mt-5 flex flex-col gap-2">
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp}?text=${waText}`}
              target="_blank"
              rel="noreferrer"
              className="btn-lift rounded-full bg-[#25D366] py-3 text-sm font-semibold text-white"
            >
              Also message on WhatsApp
            </a>
          )}
          <button
            type="button"
            onClick={() => setSent(null)}
            className="rounded-full border border-line py-3 text-sm font-medium text-ink hover:bg-sand"
          >
            Send another question
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="font-medium text-ink-soft">Check-in</span>
          <input
            type="date"
            min={today}
            value={form.checkIn}
            onChange={(e) => {
              const checkIn = e.target.value;
              setForm((f) => ({
                ...f,
                checkIn,
                checkOut:
                  f.checkOut && f.checkOut > checkIn ? f.checkOut : "",
              }));
            }}
            className={inputClass}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink-soft">Check-out</span>
          <input
            type="date"
            min={form.checkIn || today}
            value={form.checkOut}
            onChange={set("checkOut")}
            className={inputClass}
          />
        </label>
      </div>

      <div className={`grid gap-3 ${rooms.length ? "grid-cols-[6rem_1fr]" : ""}`}>
        <label className="block text-sm">
          <span className="font-medium text-ink-soft">Guests</span>
          <select value={form.guests} onChange={set("guests")} className={inputClass}>
            {Array.from({ length: 10 }, (_, i) => String(i + 1)).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        {rooms.length > 0 && (
          <label className="block text-sm">
            <span className="font-medium text-ink-soft">Room</span>
            <select value={form.room} onChange={set("room")} className={inputClass}>
              <option value="">Not sure yet</option>
              {rooms.map((r) => (
                <option key={r.name} value={r.name}>
                  {r.name}
                  {r.price > 0 ? ` — $${r.price}/night` : ""}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {(nights > 0 || estimate) && (
        <div className="animate-fade-up flex items-center justify-between rounded-xl bg-lagoon-mist/50 px-4 py-2.5 text-sm">
          <span className="text-ink-soft">
            {nights} night{nights === 1 ? "" : "s"}
            {selectedRoom ? ` · ${selectedRoom.name}` : ""}
          </span>
          {estimate && (
            <span className="font-semibold text-lagoon-deep">
              ≈ ${estimate.toLocaleString()}
            </span>
          )}
        </div>
      )}

      <label className="block text-sm">
        <span className="font-medium text-ink-soft">Your name</span>
        <input required value={form.name} onChange={set("name")} className={inputClass} />
      </label>
      <div className="space-y-3">
        <label className="block text-sm">
          <span className="font-medium text-ink-soft">Email</span>
          <input
            type="email"
            required
            value={form.email}
            onChange={set("email")}
            placeholder="you@email.com"
            className={inputClass}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink-soft">
            WhatsApp / phone <span className="text-xs font-normal">(optional)</span>
          </span>
          <input
            value={form.phone}
            onChange={set("phone")}
            inputMode="tel"
            placeholder="+44 7700 900123"
            className={inputClass}
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="font-medium text-ink-soft">
          Message <span className="text-xs font-normal">(optional)</span>
        </span>
        <textarea
          rows={compact ? 2 : 3}
          value={form.message}
          onChange={set("message")}
          placeholder="Airport transfer? Snorkeling trips? Ask anything — in any language."
          className={inputClass}
        />
      </label>

      <button
        type="submit"
        disabled={busy}
        className="btn-lift w-full rounded-full bg-lagoon py-3.5 text-sm font-semibold text-foam hover:bg-lagoon-deep disabled:opacity-50"
      >
        {busy ? "Sending…" : "Check availability"}
      </button>
      <p className="text-center text-xs text-ink-soft">
        Free, no booking fees · Usually replies {replyTime}
      </p>
      {error && (
        <p className="text-center text-sm text-coral" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

export function PickRoomButton({ room }: { room: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        window.dispatchEvent(new CustomEvent(ROOM_EVENT, { detail: room }));
        document.getElementById("enquire")?.scrollIntoView({ behavior: "smooth" });
      }}
      className="btn-lift mt-4 w-full rounded-full border border-lagoon/40 py-2.5 text-sm font-semibold text-lagoon-deep hover:bg-lagoon hover:text-foam"
    >
      Request this room
    </button>
  );
}
