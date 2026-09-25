import { eq } from "drizzle-orm";
import { CopyButton } from "@/components/CopyButton";
import { DEMO_GUESTHOUSE_ID, getDb, schema } from "@/db";
import { getSession } from "@/lib/auth";
import { SITE_URL } from "@/lib/site";

export default async function InvitePage() {
  const session = await getSession();
  if (!session) return null;

  const db = await getDb();
  const invited = await db
    .select({
      name: schema.guesthouses.name,
      island: schema.guesthouses.island,
      createdAt: schema.guesthouses.createdAt,
    })
    .from(schema.guesthouses)
    .where(eq(schema.guesthouses.referredBy, session.guesthouseId));

  const isDemo = session.guesthouseId === DEMO_GUESTHOUSE_ID;
  const link = `${SITE_URL}/register?ref=${session.guesthouseId}`;
  const message = `Assalamu alaikum! I use Meckvy for guest messages at ${session.guesthouseName} — every website enquiry lands in one inbox and replies go out in the guest's language. Try it free with my link and your first month is on us: ${link}`;

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">
          Invite & earn
        </h1>
        <p className="mt-1 text-ink-soft">
          Know another guesthouse owner? Invite them — you both get a free
          month.
        </p>
      </header>

      <section className="relative overflow-hidden rounded-2xl p-6 text-foam">
        <div className="ocean-wash absolute inset-0" />
        <div className="relative">
          <p className="font-[family-name:var(--font-display)] text-5xl font-semibold">
            1 month free
          </p>
          <p className="mt-2 max-w-md text-foam/85">
            For you and for every guesthouse that signs up with your link and
            becomes a paying customer.
          </p>
          <p className="mt-6 text-sm text-foam/70">
            Guesthouses you’ve invited:{" "}
            <span className="text-2xl font-semibold text-foam">{invited.length}</span>
          </p>
        </div>
      </section>

      {isDemo ? (
        <p className="mt-6 rounded-2xl border border-line bg-foam px-5 py-6 text-sm text-ink-soft">
          This is the demo account. Create your own free account to get a
          personal invite link.
        </p>
      ) : (
        <section className="mt-6 rounded-2xl border border-line bg-foam p-6">
          <h2 className="text-lg font-semibold text-ink">Your invite link</h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 break-all rounded-xl bg-sand px-3 py-2.5 text-sm text-ink">
              {link}
            </code>
            <CopyButton text={link} label="Copy link" />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noreferrer"
              className="btn-lift rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-95"
            >
              Share on WhatsApp
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`}
              target="_blank"
              rel="noreferrer"
              className="btn-lift rounded-full bg-[#1877F2] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-95"
            >
              Share on Facebook
            </a>
            <CopyButton
              text={message}
              label="Copy message"
              className="!bg-foam !text-lagoon-deep border border-line"
            />
          </div>
        </section>
      )}

      {invited.length > 0 && (
        <section className="mt-6 rounded-2xl border border-line bg-foam p-6">
          <h2 className="text-lg font-semibold text-ink">Joined with your link</h2>
          <ul className="mt-3 divide-y divide-line">
            {invited.map((g) => (
              <li key={`${g.name}-${g.createdAt}`} className="flex justify-between py-2 text-sm">
                <span className="text-ink">
                  {g.name} · {g.island}
                </span>
                <span className="text-ink-soft">
                  {new Date(g.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-6 text-xs text-ink-soft">
        Free months are added to your next invoice once the invited guesthouse
        makes its first payment.
      </p>
    </div>
  );
}
