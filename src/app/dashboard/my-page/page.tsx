"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { compressImage } from "@/lib/compress-image";
import {
  AMENITIES,
  LANGUAGES,
  MAX_GALLERY,
  REPLY_TIMES,
  THEMES,
  completeness,
  lowestPrice,
  type GuesthouseProfile,
  type Room,
} from "@/lib/profile";

const inputClass =
  "mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none ring-lagoon transition focus:ring-2";

const THEME_BG: Record<string, string> = {
  night: "bg-[url('/redhan.jpeg')] bg-cover bg-center",
  lagoon: "bg-gradient-to-br from-[#5fd3d0] via-[#1a9aa8] to-[#0b4f6c]",
  sunset: "bg-gradient-to-br from-[#f59e6b] via-[#e2725b] to-[#5b3a6e]",
};

const ROOM_PRESETS: Room[] = [
  { name: "Double Room", price: 80, guests: 2, note: "Queen bed, air conditioning" },
  { name: "Twin Room", price: 80, guests: 2, note: "Two single beds" },
  { name: "Triple Room", price: 105, guests: 3, note: "Three beds" },
  { name: "Family Room", price: 130, guests: 4, note: "Space for the whole family" },
  { name: "Sea View Room", price: 110, guests: 2, note: "Balcony with ocean view" },
];

type SaveState = "idle" | "saving" | "saved" | "error";

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

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
        on
          ? "border-lagoon bg-lagoon text-foam"
          : "border-line bg-white text-ink-soft hover:border-lagoon/40"
      }`}
    >
      {on ? "✓ " : ""}
      {children}
    </button>
  );
}

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function exampleDescription(name: string, island: string) {
  return `Welcome to ${name || "our guesthouse"} on ${island || "a beautiful local island"}! We are a small, family-run guesthouse with clean, air-conditioned rooms just a short walk from the beach. Our team will help you plan snorkeling trips, sandbank picnics and sunset fishing — and we arrange speedboat transfers from Velana Airport. Come as guests, leave as friends.`;
}

function PhonePreview({
  profile,
  name,
  island,
}: {
  profile: GuesthouseProfile;
  name: string;
  island: string;
}) {
  const from = lowestPrice(profile);
  return (
    <div className="mx-auto w-[17rem] overflow-hidden rounded-[2.2rem] border-[6px] border-ink bg-foam shadow-2xl shadow-ink/20">
      <div
        className={`relative h-40 ${profile.coverUrl ? "" : THEME_BG[profile.theme]}`}
        style={
          profile.coverUrl
            ? { backgroundImage: `url(${profile.coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : undefined
        }
      >
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 text-foam">
          <p className="text-[10px]">📍 {island}, Maldives</p>
          <p className="truncate font-[family-name:var(--font-display)] text-lg font-semibold leading-tight">
            {name}
          </p>
          <p className="truncate text-[11px] text-foam/85">{profile.tagline}</p>
        </div>
      </div>
      <div className="space-y-2 p-3">
        {profile.gallery.length > 0 && (
          <div className="grid grid-cols-3 gap-1">
            {profile.gallery.slice(0, 3).map((src) => (
              <div
                key={src}
                className="h-12 rounded-md bg-sand-deep bg-cover bg-center"
                style={{ backgroundImage: `url(${src})` }}
              />
            ))}
          </div>
        )}
        {profile.rooms.slice(0, 3).map((r, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border border-line px-2.5 py-1.5 text-[11px]"
          >
            <span className="truncate font-medium text-ink">{r.name || "Room"}</span>
            {r.price > 0 && <span className="font-semibold text-lagoon-deep">${r.price}</span>}
          </div>
        ))}
        {profile.rooms.length === 0 && (
          <p className="rounded-lg border border-dashed border-line px-2.5 py-2 text-center text-[11px] text-ink-soft">
            Your rooms appear here
          </p>
        )}
        <div className="flex flex-wrap gap-1">
          {profile.amenities.slice(0, 4).map((a) => (
            <span key={a} className="rounded-full bg-sand px-2 py-0.5 text-[10px] text-ink-soft">
              {a}
            </span>
          ))}
        </div>
        <div className="rounded-full bg-lagoon py-2 text-center text-[11px] font-semibold text-foam">
          Check availability{from ? ` · from $${from}` : ""}
        </div>
      </div>
    </div>
  );
}

export default function MyPageEditor() {
  const [profile, setProfile] = useState<GuesthouseProfile | null>(null);
  const [meta, setMeta] = useState({ id: "", name: "", island: "", pageViews: 0, isDemo: false });
  const [origin, setOrigin] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState("");
  const [upload, setUpload] = useState<{ done: number; total: number } | null>(null);
  const [uploadError, setUploadError] = useState("");
  const dirty = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void fetch("/api/guesthouse/profile")
      .then((r) => r.json())
      .then(
        (d: {
          id: string;
          name: string;
          island: string;
          pageViews: number;
          isDemo: boolean;
          profile: GuesthouseProfile;
        }) => {
          setOrigin(window.location.origin);
          setProfile(d.profile);
          setMeta({
            id: d.id,
            name: d.name,
            island: d.island,
            pageViews: d.pageViews,
            isDemo: d.isDemo,
          });
        },
      );
  }, []);

  const save = useCallback(async (next: GuesthouseProfile) => {
    setSaveState("saving");
    try {
      const res = await fetch("/api/guesthouse/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: next }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setSaveState("error");
        setSaveError(data.error ?? "Could not save");
        return;
      }
      setSaveState("saved");
    } catch {
      setSaveState("error");
      setSaveError("No connection — changes not saved yet");
    }
  }, []);

  useEffect(() => {
    if (!profile || !dirty.current || meta.isDemo) return;
    const t = setTimeout(() => {
      dirty.current = false;
      void save(profile);
    }, 1200);
    return () => clearTimeout(t);
  }, [profile, meta.isDemo, save]);

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-2xl bg-foam" />
        ))}
      </div>
    );
  }

  const change = (patch: Partial<GuesthouseProfile>) => {
    dirty.current = true;
    setProfile((p) => (p ? { ...p, ...patch } : p));
  };

  const updateRoom = (i: number, patch: Partial<Room>) =>
    change({ rooms: profile.rooms.map((r, idx) => (idx === i ? { ...r, ...patch } : r)) });

  async function addPhotos(files: FileList | null) {
    if (!files?.length || !profile) return;
    setUploadError("");
    const room = MAX_GALLERY - profile.gallery.length;
    const list = Array.from(files).slice(0, Math.max(0, room));
    if (list.length === 0) {
      setUploadError(`You can show up to ${MAX_GALLERY} photos — remove one first.`);
      return;
    }
    const urls: string[] = [];
    setUpload({ done: 0, total: list.length });
    for (const file of list) {
      try {
        const dataUrl = await compressImage(file);
        const res = await fetch("/api/photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataUrl }),
        });
        const data = (await res.json()) as { ok?: boolean; url?: string; error?: string };
        if (!res.ok || !data.url) {
          setUploadError(data.error ?? "A photo could not be uploaded");
          break;
        }
        urls.push(data.url);
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "A photo could not be uploaded");
        break;
      }
      setUpload((u) => (u ? { ...u, done: u.done + 1 } : u));
    }
    setUpload(null);
    if (fileInput.current) fileInput.current.value = "";
    if (urls.length) {
      dirty.current = true;
      setProfile((p) =>
        p
          ? { ...p, gallery: [...p.gallery, ...urls], coverUrl: p.coverUrl || urls[0] }
          : p,
      );
    }
  }

  function removePhoto(src: string) {
    if (src.startsWith("/api/photos/")) {
      void fetch(src, { method: "DELETE" });
    }
    change({
      gallery: profile!.gallery.filter((g) => g !== src),
      coverUrl: profile!.coverUrl === src ? "" : profile!.coverUrl,
    });
  }

  function movePhoto(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= profile!.gallery.length) return;
    const next = [...profile!.gallery];
    [next[i], next[j]] = [next[j], next[i]];
    change({ gallery: next });
  }

  const pageUrl = origin && meta.id ? `${origin}/widget/${meta.id}` : "";
  const { score, checks } = completeness(profile);

  return (
    <div className="mx-auto max-w-6xl pb-24">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">
            My booking page
          </h1>
          <p className="mt-1 text-ink-soft">
            Changes save automatically and go live instantly.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CopyButton text={pageUrl} label="Copy link" />
          <a
            href={pageUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-lift rounded-full bg-lagoon px-5 py-2 text-sm font-semibold text-foam hover:bg-lagoon-deep"
          >
            View my page ↗
          </a>
        </div>
      </header>

      {meta.isDemo && (
        <p className="mb-6 rounded-2xl border border-coral/30 bg-foam p-4 text-sm text-ink-soft">
          This is the demo guesthouse — have a play, but changes won’t be saved.{" "}
          <a href="/register" className="font-semibold text-lagoon-deep underline">
            Create your free account
          </a>{" "}
          to build your own page in 5 minutes.
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_19rem]">
        <div className="space-y-5">
          {/* Completeness */}
          <section className="rounded-2xl border border-lagoon/30 bg-gradient-to-br from-lagoon-mist/50 to-foam p-6">
            <div className="flex items-center gap-5">
              <div
                className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(var(--lagoon) ${score * 3.6}deg, rgba(13,107,110,0.15) 0deg)`,
                }}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-foam">
                  <span className="font-[family-name:var(--font-display)] text-xl font-semibold text-lagoon-deep">
                    {score}%
                  </span>
                </div>
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-ink">
                  {score === 100
                    ? "Your page is complete — beautiful! 🌴"
                    : score >= 70
                      ? "Almost there!"
                      : "Let’s make your page shine"}
                </h2>
                <p className="mt-0.5 text-sm text-ink-soft">
                  Complete pages get far more enquiries. {meta.pageViews} view
                  {meta.pageViews === 1 ? "" : "s"} so far.
                </p>
              </div>
            </div>
            {score < 100 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {checks
                  .filter((c) => !c.done)
                  .map((c) => (
                    <span
                      key={c.label}
                      className="rounded-full border border-dashed border-lagoon/40 bg-foam px-3 py-1 text-xs text-ink-soft"
                    >
                      + {c.label}
                    </span>
                  ))}
              </div>
            )}
          </section>

          {/* Photos */}
          <Section
            title="Photos"
            hint="Add photos straight from your phone or computer — we resize them automatically. Tap ★ to choose the cover."
          >
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => void addPhotos(e.target.files)}
            />
            <button
              type="button"
              disabled={Boolean(upload) || meta.isDemo}
              onClick={() => fileInput.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (!meta.isDemo) void addPhotos(e.dataTransfer.files);
              }}
              className="flex w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-lagoon/40 bg-lagoon-mist/20 px-4 py-8 text-center transition hover:border-lagoon hover:bg-lagoon-mist/40 disabled:opacity-60"
            >
              <span className="text-3xl">📸</span>
              <span className="font-semibold text-lagoon-deep">
                {upload
                  ? `Uploading ${Math.min(upload.done + 1, upload.total)} of ${upload.total}…`
                  : "Add photos"}
              </span>
              <span className="text-xs text-ink-soft">
                Tap to choose, or drag photos here · up to {MAX_GALLERY}
              </span>
            </button>
            {uploadError && <p className="text-sm text-coral">{uploadError}</p>}

            {profile.gallery.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {profile.gallery.map((src, i) => {
                  const isCover = profile.coverUrl === src;
                  return (
                    <div
                      key={src}
                      className={`group relative aspect-[4/3] overflow-hidden rounded-xl border-2 ${
                        isCover ? "border-coral" : "border-transparent"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="h-full w-full object-cover" />
                      {isCover && (
                        <span className="absolute left-2 top-2 rounded-full bg-coral px-2 py-0.5 text-[11px] font-semibold text-foam">
                          Cover
                        </span>
                      )}
                      <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-ink/80 to-transparent p-2">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            aria-label="Move left"
                            onClick={() => movePhoto(i, -1)}
                            className="h-8 w-8 rounded-full bg-foam/90 text-sm text-ink hover:bg-white"
                          >
                            ‹
                          </button>
                          <button
                            type="button"
                            aria-label="Move right"
                            onClick={() => movePhoto(i, 1)}
                            className="h-8 w-8 rounded-full bg-foam/90 text-sm text-ink hover:bg-white"
                          >
                            ›
                          </button>
                        </div>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            aria-label="Use as cover"
                            title="Use as cover"
                            onClick={() => change({ coverUrl: src })}
                            className={`h-8 w-8 rounded-full text-sm ${
                              isCover ? "bg-coral text-foam" : "bg-foam/90 text-ink hover:bg-white"
                            }`}
                          >
                            ★
                          </button>
                          <button
                            type="button"
                            aria-label="Remove photo"
                            onClick={() => removePhoto(src)}
                            className="h-8 w-8 rounded-full bg-foam/90 text-sm text-coral hover:bg-white"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!profile.coverUrl && (
              <div>
                <p className="text-sm font-medium text-ink-soft">
                  No cover photo yet? Pick a style:
                </p>
                <div className="mt-2 grid grid-cols-3 gap-3">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => change({ theme: t.id })}
                      className={`overflow-hidden rounded-xl border-2 text-left transition ${
                        profile.theme === t.id ? "border-lagoon" : "border-transparent hover:border-line"
                      }`}
                    >
                      <div className={`h-16 ${THEME_BG[t.id]}`} />
                      <p className="bg-sand px-2 py-1.5 text-xs font-medium text-ink">{t.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Section>

          <Section title="Your story" hint="Short and friendly works best.">
            <label className="block text-sm">
              <span className="font-medium text-ink-soft">Tagline</span>
              <input
                value={profile.tagline}
                maxLength={90}
                onChange={(e) => change({ tagline: e.target.value })}
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              <span className="flex items-center justify-between font-medium text-ink-soft">
                About your guesthouse
                <span className="text-xs font-normal">{profile.description.length}/1200</span>
              </span>
              <textarea
                rows={5}
                maxLength={1200}
                value={profile.description}
                onChange={(e) => change({ description: e.target.value })}
                placeholder="What makes your guesthouse special?"
                className={inputClass}
              />
            </label>
            {profile.description.length < 20 && (
              <button
                type="button"
                onClick={() => change({ description: exampleDescription(meta.name, meta.island) })}
                className="rounded-full border border-lagoon/40 px-4 py-2 text-sm font-semibold text-lagoon-deep hover:bg-lagoon-mist/40"
              >
                ✨ Write it for me — then edit
              </button>
            )}
          </Section>

          <Section title="Rooms & prices" hint="Guests see prices per night and a live estimate for their dates.">
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
                      inputMode="numeric"
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
                      inputMode="numeric"
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
                    onClick={() => change({ rooms: profile.rooms.filter((_, idx) => idx !== i) })}
                    className="rounded-full border border-line px-4 py-2.5 text-sm text-coral hover:bg-foam"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <div>
              <p className="text-sm font-medium text-ink-soft">Quick add:</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {ROOM_PRESETS.filter((p) => !profile.rooms.some((r) => r.name === p.name)).map(
                  (preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => change({ rooms: [...profile.rooms, preset] })}
                      className="rounded-full border border-line bg-white px-3.5 py-1.5 text-sm text-ink hover:border-lagoon/50"
                    >
                      + {preset.name}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  onClick={() =>
                    change({ rooms: [...profile.rooms, { name: "", price: 0, guests: 2, note: "" }] })
                  }
                  className="rounded-full border border-dashed border-lagoon/50 px-3.5 py-1.5 text-sm font-semibold text-lagoon-deep"
                >
                  + Custom room
                </button>
              </div>
            </div>
          </Section>

          <Section title="What you offer" hint="Tap everything that applies.">
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map((a) => (
                <Chip
                  key={a}
                  on={profile.amenities.includes(a)}
                  onClick={() => change({ amenities: toggle(profile.amenities, a) })}
                >
                  {a}
                </Chip>
              ))}
            </div>
          </Section>

          <Section title="Arrival & guest info">
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block text-sm">
                <span className="font-medium text-ink-soft">Check-in from</span>
                <input
                  type="time"
                  value={profile.checkIn}
                  onChange={(e) => change({ checkIn: e.target.value })}
                  className={inputClass}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-ink-soft">Check-out by</span>
                <input
                  type="time"
                  value={profile.checkOut}
                  onChange={(e) => change({ checkOut: e.target.value })}
                  className={inputClass}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-ink-soft">You usually reply</span>
                <select
                  value={profile.replyTime}
                  onChange={(e) => change({ replyTime: e.target.value })}
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
                onChange={(e) => change({ transfer: e.target.value })}
                placeholder="Speedboat from Velana Airport — 30 min, USD 25 per person"
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-ink-soft">Google Maps link (optional)</span>
              <input
                value={profile.mapsUrl}
                onChange={(e) => change({ mapsUrl: e.target.value })}
                placeholder="https://maps.app.goo.gl/…"
                className={inputClass}
              />
            </label>
            <div>
              <p className="text-sm font-medium text-ink-soft">Languages you speak</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {LANGUAGES.map((l) => (
                  <Chip
                    key={l}
                    on={profile.languages.includes(l)}
                    onClick={() => change({ languages: toggle(profile.languages, l) })}
                  >
                    {l}
                  </Chip>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Contact buttons" hint="Guests can reach you in one tap.">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="font-medium text-ink-soft">WhatsApp number</span>
                <input
                  value={profile.whatsapp}
                  inputMode="tel"
                  onChange={(e) => change({ whatsapp: e.target.value })}
                  placeholder="9607XXXXXX"
                  className={inputClass}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-ink-soft">Instagram username</span>
                <input
                  value={profile.instagram}
                  onChange={(e) => change({ instagram: e.target.value })}
                  placeholder="lagoonpearl.mv"
                  className={inputClass}
                />
              </label>
            </div>
          </Section>
        </div>

        <aside className="hidden xl:block">
          <div className="sticky top-6 space-y-3">
            <p className="text-center text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Live preview
            </p>
            <PhonePreview profile={profile} name={meta.name} island={meta.island} />
          </div>
        </aside>
      </div>

      {/* Save status pill */}
      {!meta.isDemo && saveState !== "idle" && (
        <div className="fixed bottom-5 right-5 z-30">
          <div
            className={`animate-fade-in rounded-full px-4 py-2 text-sm font-medium shadow-lg ${
              saveState === "error"
                ? "bg-coral text-foam"
                : "bg-ink text-foam"
            }`}
          >
            {saveState === "saving" && "Saving…"}
            {saveState === "saved" && "✓ All changes saved"}
            {saveState === "error" && (
              <button type="button" onClick={() => void save(profile)} className="underline">
                {saveError} — retry
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
