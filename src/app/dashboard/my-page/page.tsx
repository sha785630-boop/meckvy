"use client";

import { useEffect, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import {
  AMENITIES,
  LANGUAGES,
  REPLY_TIMES,
  THEMES,
  type GuesthouseProfile,
  type Room,
} from "@/lib/profile";

const inputClass =
  "mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none ring-lagoon focus:ring-2";

const THEME_PREVIEW: Record<string, string> = {
  night: "bg-[url('/redhan.jpeg')] bg-cover bg-center",
  lagoon: "bg-gradient-to-br from-[#5fd3d0] via-[#1a9aa8] to-[#0b4f6c]",
  sunset: "bg-gradient-to-br from-[#f59e6b] via-[#e2725b] to-[#5b3a6e]",
};

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-foam p-6">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {hint && <p className="mt-1 text-sm text-ink-soft">{hint}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function MyPageEditor() {
  const [profile, setProfile] = useState<GuesthouseProfile | null>(null);
  const [meta, setMeta] = useState({ id: "", name: "", pageViews: 0, isDemo: false });
  const [origin, setOrigin] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    void fetch("/api/guesthouse/profile")
      .then((r) => r.json())
      .then(
        (d: {
          id: string;
          name: string;
          pageViews: number;
          isDemo: boolean;
          profile: GuesthouseProfile;
        }) => {
          setOrigin(window.location.origin);
          setProfile(d.profile);
          setMeta({ id: d.id, name: d.name, pageViews: d.pageViews, isDemo: d.isDemo });
        },
      );
  }, []);

  if (!profile) {
    return <p className="text-sm text-ink-soft">Loading your page…</p>;
  }

  const update = <K extends keyof GuesthouseProfile>(
    key: K,
    value: GuesthouseProfile[K],
  ) => {
    setProfile((p) => (p ? { ...p, [key]: value } : p));
    setStatus(null);
  };

  const updateRoom = (i: number, patch: Partial<Room>) =>
    update(
      "rooms",
      profile.rooms.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    );

  async function save() {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/guesthouse/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        profile?: GuesthouseProfile;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.profile) {
        setStatus({ ok: false, text: data.error ?? "Could not save" });
        return;
      }
      setProfile(data.profile);
      setStatus({ ok: true, text: "Saved — your page is live with the changes." });
    } finally {
      setSaving(false);
    }
  }

  const pageUrl = origin && meta.id ? `${origin}/widget/${meta.id}` : "";

  return (
    <div className="mx-auto max-w-3xl pb-28">
      <header className="mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">
          My booking page
        </h1>
        <p className="mt-1 text-ink-soft">
          A free, mobile-friendly page for {meta.name || "your guesthouse"} — rooms,
          prices and an enquiry form guests love. No website needed.
        </p>
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-lagoon/30 bg-lagoon-mist/30 p-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-lagoon-deep">
            Your page · {meta.pageViews} view{meta.pageViews === 1 ? "" : "s"}
          </p>
          <p className="truncate text-sm text-ink">{pageUrl || "…"}</p>
        </div>
        <CopyButton text={pageUrl} label="Copy link" />
        <a
          href={pageUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-lagoon px-4 py-2 text-sm font-semibold text-foam hover:bg-lagoon-deep"
        >
          View page ↗
        </a>
      </div>

      {meta.isDemo && (
        <p className="mb-6 rounded-2xl border border-coral/30 bg-foam p-4 text-sm text-ink-soft">
          This is the demo guesthouse, so changes can’t be saved.{" "}
          <a href="/register" className="font-semibold text-lagoon-deep underline">
            Create your free account
          </a>{" "}
          to build your own page in 5 minutes.
        </p>
      )}

      <div className="space-y-5">
        <Section title="Look & feel" hint="Pick a cover. Have a photo online? Paste its link.">
          <div className="grid grid-cols-3 gap-3">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => update("theme", t.id)}
                className={`overflow-hidden rounded-xl border-2 text-left transition ${
                  profile.theme === t.id && !profile.coverUrl
                    ? "border-lagoon"
                    : "border-transparent hover:border-line"
                }`}
              >
                <div className={`h-20 ${THEME_PREVIEW[t.id]}`} />
                <p className="bg-sand px-2 py-1.5 text-xs font-medium text-ink">{t.label}</p>
              </button>
            ))}
          </div>
          <label className="block text-sm">
            <span className="font-medium text-ink-soft">
              Your own cover photo link <span className="text-xs">(optional, https://…)</span>
            </span>
            <input
              value={profile.coverUrl}
              onChange={(e) => update("coverUrl", e.target.value)}
              placeholder="https://…/my-guesthouse.jpg"
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-ink-soft">Tagline</span>
            <input
              value={profile.tagline}
              maxLength={90}
              onChange={(e) => update("tagline", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-ink-soft">About your guesthouse</span>
            <textarea
              rows={5}
              maxLength={1200}
              value={profile.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Family-run, 2 minutes from the beach. We arrange snorkeling, sandbank trips and airport transfers…"
              className={inputClass}
            />
          </label>
        </Section>

        <Section title="Rooms & prices" hint="Guests see prices per night and get a live estimate for their dates.">
          {profile.rooms.map((room, i) => (
            <div key={i} className="rounded-xl border border-line bg-sand/40 p-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_7rem_6rem]">
                <label className="block text-sm">
                  <span className="font-medium text-ink-soft">Room name</span>
                  <input
                    value={room.name}
                    onChange={(e) => updateRoom(i, { name: e.target.value })}
                    placeholder="Deluxe Double"
                    className={inputClass}
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-ink-soft">USD / night</span>
                  <input
                    type="number"
                    min={0}
                    value={room.price || ""}
                    onChange={(e) => updateRoom(i, { price: Number(e.target.value) })}
                    placeholder="85"
                    className={inputClass}
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-ink-soft">Guests</span>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={room.guests}
                    onChange={(e) => updateRoom(i, { guests: Number(e.target.value) })}
                    className={inputClass}
                  />
                </label>
              </div>
              <div className="mt-3 flex items-end gap-3">
                <label className="block flex-1 text-sm">
                  <span className="font-medium text-ink-soft">Short note</span>
                  <input
                    value={room.note}
                    onChange={(e) => updateRoom(i, { note: e.target.value })}
                    placeholder="Queen bed, balcony, sea view"
                    className={inputClass}
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    update(
                      "rooms",
                      profile.rooms.filter((_, idx) => idx !== i),
                    )
                  }
                  className="rounded-full border border-line px-4 py-2.5 text-sm text-coral hover:bg-foam"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              update("rooms", [...profile.rooms, { name: "", price: 0, guests: 2, note: "" }])
            }
            className="w-full rounded-xl border-2 border-dashed border-line py-3 text-sm font-semibold text-lagoon-deep hover:border-lagoon/50"
          >
            + Add a room
          </button>
        </Section>

        <Section title="What you offer" hint="Tap everything that applies.">
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map((a) => {
              const on = profile.amenities.includes(a);
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => update("amenities", toggle(profile.amenities, a))}
                  className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                    on
                      ? "border-lagoon bg-lagoon text-foam"
                      : "border-line bg-white text-ink-soft hover:border-lagoon/40"
                  }`}
                >
                  {on ? "✓ " : ""}
                  {a}
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Arrival & guest info">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-sm">
              <span className="font-medium text-ink-soft">Check-in from</span>
              <input
                type="time"
                value={profile.checkIn}
                onChange={(e) => update("checkIn", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-ink-soft">Check-out by</span>
              <input
                type="time"
                value={profile.checkOut}
                onChange={(e) => update("checkOut", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-ink-soft">You usually reply</span>
              <select
                value={profile.replyTime}
                onChange={(e) => update("replyTime", e.target.value)}
                className={inputClass}
              >
                {REPLY_TIMES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-sm">
            <span className="font-medium text-ink-soft">Transfer info</span>
            <input
              value={profile.transfer}
              maxLength={200}
              onChange={(e) => update("transfer", e.target.value)}
              placeholder="Speedboat from Velana Airport — 30 min, USD 25 per person"
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-ink-soft">Google Maps link (optional)</span>
            <input
              value={profile.mapsUrl}
              onChange={(e) => update("mapsUrl", e.target.value)}
              placeholder="https://maps.app.goo.gl/…"
              className={inputClass}
            />
          </label>
          <div>
            <p className="text-sm font-medium text-ink-soft">Languages you speak</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {LANGUAGES.map((l) => {
                const on = profile.languages.includes(l);
                return (
                  <button
                    key={l}
                    type="button"
                    onClick={() => update("languages", toggle(profile.languages, l))}
                    className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                      on
                        ? "border-lagoon bg-lagoon text-foam"
                        : "border-line bg-white text-ink-soft hover:border-lagoon/40"
                    }`}
                  >
                    {l}
                  </button>
                );
              })}
            </div>
          </div>
        </Section>

        <Section title="Contact buttons" hint="Shown on your page so guests can reach you instantly.">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-ink-soft">WhatsApp number</span>
              <input
                value={profile.whatsapp}
                inputMode="tel"
                onChange={(e) => update("whatsapp", e.target.value)}
                placeholder="9607XXXXXX"
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-ink-soft">Instagram username</span>
              <input
                value={profile.instagram}
                onChange={(e) => update("instagram", e.target.value)}
                placeholder="lagoonpearl.mv"
                className={inputClass}
              />
            </label>
          </div>
        </Section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-foam/95 px-4 py-3 backdrop-blur md:left-56">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-end gap-3">
          {status && (
            <p className={`mr-auto text-sm ${status.ok ? "text-lagoon-deep" : "text-coral"}`}>
              {status.text}
            </p>
          )}
          <a
            href={pageUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink hover:bg-sand"
          >
            Preview
          </a>
          <button
            type="button"
            disabled={saving || meta.isDemo}
            onClick={() => void save()}
            className="btn-lift rounded-full bg-lagoon px-6 py-2.5 text-sm font-semibold text-foam hover:bg-lagoon-deep disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save & publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
