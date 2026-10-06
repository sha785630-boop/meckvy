export type Room = {
  name: string;
  price: number;
  guests: number;
  note: string;
};

export type CoverTheme = "night" | "lagoon" | "sunset";

export type GuesthouseProfile = {
  tagline: string;
  description: string;
  coverUrl: string;
  theme: CoverTheme;
  rooms: Room[];
  amenities: string[];
  checkIn: string;
  checkOut: string;
  transfer: string;
  whatsapp: string;
  instagram: string;
  mapsUrl: string;
  replyTime: string;
  languages: string[];
};

export const AMENITIES = [
  "Free Wi-Fi",
  "Air conditioning",
  "Breakfast included",
  "Beach access",
  "Snorkeling trips",
  "Diving",
  "Sandbank trips",
  "Fishing trips",
  "Airport transfer",
  "Speedboat transfer",
  "Hot water",
  "Rooftop terrace",
  "Restaurant",
  "Bikini beach nearby",
  "Family friendly",
  "Laundry",
] as const;

export const LANGUAGES = [
  "English",
  "Dhivehi",
  "Russian",
  "Italian",
  "German",
  "Chinese",
  "Arabic",
  "French",
] as const;

export const THEMES: { id: CoverTheme; label: string }[] = [
  { id: "night", label: "Glowing night" },
  { id: "lagoon", label: "Turquoise lagoon" },
  { id: "sunset", label: "Island sunset" },
];

export const REPLY_TIMES = [
  "within an hour",
  "within a few hours",
  "the same day",
] as const;

export function defaultProfile(island = ""): GuesthouseProfile {
  return {
    tagline: island
      ? `Your island home on ${island}`
      : "Your island home in the Maldives",
    description: "",
    coverUrl: "",
    theme: "night",
    rooms: [],
    amenities: ["Free Wi-Fi", "Air conditioning", "Breakfast included"],
    checkIn: "14:00",
    checkOut: "12:00",
    transfer: "",
    whatsapp: "",
    instagram: "",
    mapsUrl: "",
    replyTime: "within a few hours",
    languages: ["English"],
  };
}

function str(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function httpUrl(value: unknown): string {
  const s = str(value, 500);
  return /^https:\/\/\S+$/i.test(s) ? s : "";
}

export function sanitizeProfile(
  input: unknown,
  island = "",
): GuesthouseProfile {
  const base = defaultProfile(island);
  if (!input || typeof input !== "object") return base;
  const p = input as Record<string, unknown>;

  const rooms = Array.isArray(p.rooms)
    ? p.rooms
        .slice(0, 12)
        .map((r) => {
          const room = (r ?? {}) as Record<string, unknown>;
          return {
            name: str(room.name, 60),
            price: Math.max(0, Math.min(99999, Math.round(Number(room.price) || 0))),
            guests: Math.max(1, Math.min(20, Math.round(Number(room.guests) || 2))),
            note: str(room.note, 120),
          };
        })
        .filter((r) => r.name)
    : base.rooms;

  const pick = (list: readonly string[], value: unknown, fallback: string[]) =>
    Array.isArray(value)
      ? value.filter((v): v is string => typeof v === "string" && list.includes(v))
      : fallback;

  const theme = THEMES.some((t) => t.id === p.theme)
    ? (p.theme as CoverTheme)
    : base.theme;

  return {
    tagline: str(p.tagline, 90) || base.tagline,
    description: str(p.description, 1200),
    coverUrl: httpUrl(p.coverUrl),
    theme,
    rooms,
    amenities: pick(AMENITIES, p.amenities, base.amenities),
    checkIn: str(p.checkIn, 10) || base.checkIn,
    checkOut: str(p.checkOut, 10) || base.checkOut,
    transfer: str(p.transfer, 200),
    whatsapp: str(p.whatsapp, 20).replace(/\D/g, ""),
    instagram: str(p.instagram, 40).replace(/^@/, "").replace(/[^\w.]/g, ""),
    mapsUrl: httpUrl(p.mapsUrl),
    replyTime: (REPLY_TIMES as readonly string[]).includes(str(p.replyTime, 40))
      ? str(p.replyTime, 40)
      : base.replyTime,
    languages: pick(LANGUAGES, p.languages, base.languages),
  };
}

export function parseProfile(
  json: string | null | undefined,
  island = "",
): GuesthouseProfile {
  if (!json) return defaultProfile(island);
  try {
    return sanitizeProfile(JSON.parse(json), island);
  } catch {
    return defaultProfile(island);
  }
}

export function lowestPrice(profile: GuesthouseProfile): number | null {
  const prices = profile.rooms.map((r) => r.price).filter((n) => n > 0);
  return prices.length ? Math.min(...prices) : null;
}
