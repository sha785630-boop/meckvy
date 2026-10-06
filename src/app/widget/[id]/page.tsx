import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EnquiryForm, PickRoomButton } from "@/components/EnquiryForm";
import { PhotoGallery } from "@/components/PhotoGallery";
import { countPageView, getPublicGuesthouse } from "@/lib/guesthouse-page";
import { lowestPrice, type GuesthouseProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const AMENITY_ICONS: Record<string, string> = {
  "Free Wi-Fi": "📶",
  "Air conditioning": "❄️",
  "Breakfast included": "🍳",
  "Beach access": "🏖️",
  "Snorkeling trips": "🤿",
  Diving: "🐠",
  "Sandbank trips": "🏝️",
  "Fishing trips": "🎣",
  "Airport transfer": "✈️",
  "Speedboat transfer": "🚤",
  "Hot water": "🚿",
  "Rooftop terrace": "🌅",
  Restaurant: "🍽️",
  "Bikini beach nearby": "👙",
  "Family friendly": "👨‍👩‍👧",
  Laundry: "🧺",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const gh = await getPublicGuesthouse(id);
  if (!gh) return { title: "Guesthouse not found" };
  const from = lowestPrice(gh.profile);
  return {
    title: `${gh.name} — ${gh.island}, Maldives`,
    description: `${gh.profile.tagline}${from ? ` · Rooms from $${from}/night` : ""}. Check availability and message ${gh.name} directly.`,
  };
}

function Cover({ profile }: { profile: GuesthouseProfile }) {
  if (profile.coverUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={profile.coverUrl}
        alt=""
        className="animate-ken-burns absolute inset-0 h-full w-full object-cover"
      />
    );
  }
  if (profile.theme === "night") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/redhan.jpeg"
        alt=""
        className="animate-ken-burns absolute inset-0 h-full w-full object-cover"
      />
    );
  }
  return (
    <div
      className={`absolute inset-0 ${
        profile.theme === "sunset"
          ? "bg-gradient-to-br from-[#f59e6b] via-[#e2725b] to-[#5b3a6e]"
          : "bg-gradient-to-br from-[#5fd3d0] via-[#1a9aa8] to-[#0b4f6c]"
      }`}
    />
  );
}

export default async function GuesthousePage({ params, searchParams }: Props) {
  const { id } = await params;
  const embed = (await searchParams).embed === "1";
  const gh = await getPublicGuesthouse(id);
  if (!gh) notFound();
  const { profile } = gh;

  if (embed) {
    return (
      <div className="bg-transparent p-3">
        <div className="mx-auto max-w-md rounded-2xl border border-line/80 bg-foam/95 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-lagoon-deep">
            Message the guesthouse
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold text-ink">
            {gh.name}
          </h1>
          <p className="mb-4 mt-1 text-sm text-ink-soft">{gh.island}, Maldives</p>
          <EnquiryForm
            guesthouseId={gh.id}
            guesthouseName={gh.name}
            rooms={profile.rooms}
            replyTime={profile.replyTime}
            whatsapp={profile.whatsapp}
            compact
          />
        </div>
      </div>
    );
  }

  await countPageView(gh.id);
  const from = lowestPrice(profile);
  const waLink = profile.whatsapp
    ? `https://wa.me/${profile.whatsapp}?text=${encodeURIComponent(`Hi ${gh.name}! I found you online and have a question.`)}`
    : null;

  return (
    <main className="min-h-screen bg-sand pb-24 md:pb-0">
      {/* Hero */}
      <section className="relative flex min-h-[78svh] flex-col justify-end overflow-hidden px-5 pb-12 pt-24 md:px-10 md:pb-16">
        <Cover profile={profile} />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-ink/10" />
        <div className="relative mx-auto w-full max-w-6xl text-foam">
          <p className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-foam/30 bg-foam/10 px-3 py-1 text-xs font-medium backdrop-blur">
            📍 {gh.island}, Maldives
          </p>
          <h1 className="animate-fade-up-delay mt-4 max-w-3xl font-[family-name:var(--font-display)] text-4xl font-semibold leading-tight md:text-6xl">
            {gh.name}
          </h1>
          <p className="animate-fade-up-delay mt-3 max-w-2xl text-lg text-foam/85 md:text-xl">
            {profile.tagline}
          </p>
          <div className="animate-fade-up-delay-2 mt-7 flex flex-wrap items-center gap-3">
            <a
              href="#enquire"
              className="btn-lift rounded-full bg-foam px-7 py-3.5 text-sm font-semibold text-ink hover:bg-white"
            >
              Check availability
            </a>
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="btn-lift rounded-full bg-[#25D366] px-6 py-3.5 text-sm font-semibold text-white"
              >
                WhatsApp us
              </a>
            )}
            {from && (
              <span className="rounded-full bg-ink/40 px-4 py-2 text-sm backdrop-blur">
                Rooms from <strong className="text-lg">${from}</strong>/night
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Quick facts */}
      <section className="border-b border-line bg-foam px-5 md:px-10">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 py-5 text-sm md:grid-cols-4">
          {[
            { k: "Check-in", v: `from ${profile.checkIn}` },
            { k: "Check-out", v: `by ${profile.checkOut}` },
            { k: "Replies", v: profile.replyTime },
            { k: "We speak", v: profile.languages.join(", ") },
          ].map((f) => (
            <div key={f.k}>
              <p className="text-xs uppercase tracking-wide text-ink-soft">{f.k}</p>
              <p className="mt-0.5 font-medium text-ink">{f.v}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:px-10 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-12">
          {profile.gallery.length > 0 && (
            <section>
              <PhotoGallery photos={profile.gallery} name={gh.name} />
            </section>
          )}

          {profile.description && (
            <section>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-ink md:text-3xl">
                About us
              </h2>
              <p className="mt-4 whitespace-pre-line leading-relaxed text-ink-soft">
                {profile.description}
              </p>
            </section>
          )}

          {profile.rooms.length > 0 && (
            <section>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-ink md:text-3xl">
                Rooms
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {profile.rooms.map((room) => (
                  <div
                    key={room.name}
                    className="flex flex-col rounded-2xl border border-line bg-foam p-5 transition hover:-translate-y-0.5 hover:border-lagoon/40 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold text-ink">{room.name}</h3>
                      {room.price > 0 && (
                        <p className="text-right">
                          <span className="font-[family-name:var(--font-display)] text-2xl font-semibold text-lagoon-deep">
                            ${room.price}
                          </span>
                          <span className="block text-xs text-ink-soft">per night</span>
                        </p>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-ink-soft">
                      👥 Up to {room.guests} guest{room.guests === 1 ? "" : "s"}
                      {room.note ? ` · ${room.note}` : ""}
                    </p>
                    <div className="mt-auto">
                      <PickRoomButton room={room.name} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {profile.amenities.length > 0 && (
            <section>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-ink md:text-3xl">
                What we offer
              </h2>
              <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {profile.amenities.map((a) => (
                  <li
                    key={a}
                    className="flex items-center gap-2 rounded-xl border border-line bg-foam px-3 py-3 text-sm text-ink"
                  >
                    <span className="text-lg">{AMENITY_ICONS[a] ?? "✨"}</span>
                    {a}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(profile.transfer || profile.mapsUrl) && (
            <section>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-ink md:text-3xl">
                Getting here
              </h2>
              {profile.transfer && (
                <p className="mt-4 leading-relaxed text-ink-soft">🚤 {profile.transfer}</p>
              )}
              {profile.mapsUrl && (
                <a
                  href={profile.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex rounded-full border border-line bg-foam px-5 py-2.5 text-sm font-medium text-ink hover:bg-white"
                >
                  📍 Open in Google Maps
                </a>
              )}
            </section>
          )}
        </div>

        {/* Enquiry */}
        <aside id="enquire" className="scroll-mt-6">
          <div className="rounded-3xl border border-line bg-foam p-6 shadow-xl shadow-ink/5 lg:sticky lg:top-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-ink">
              Check availability
            </h2>
            <p className="mb-5 mt-1 text-sm text-ink-soft">
              Book direct — best price, no booking fees.
            </p>
            <EnquiryForm
              guesthouseId={gh.id}
              guesthouseName={gh.name}
              rooms={profile.rooms}
              replyTime={profile.replyTime}
              whatsapp={profile.whatsapp}
            />
          </div>
        </aside>
      </div>

      <footer className="border-t border-line bg-foam px-5 py-8 text-sm text-ink-soft md:px-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-4">
            {profile.instagram && (
              <a
                href={`https://instagram.com/${profile.instagram}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-ink"
              >
                Instagram @{profile.instagram}
              </a>
            )}
            {waLink && (
              <a href={waLink} target="_blank" rel="noreferrer" className="hover:text-ink">
                WhatsApp
              </a>
            )}
          </div>
          <Link href="/" className="hover:text-ink">
            Free booking page by <strong className="text-lagoon-deep">Meckvy</strong> — get
            yours
          </Link>
        </div>
      </footer>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-foam/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{gh.name}</p>
          {from && <p className="text-xs text-ink-soft">from ${from}/night</p>}
        </div>
        <a
          href="#enquire"
          className="rounded-full bg-lagoon px-5 py-2.5 text-sm font-semibold text-foam"
        >
          Check availability
        </a>
      </div>
    </main>
  );
}
