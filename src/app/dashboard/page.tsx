import { eq } from "drizzle-orm";
import Link from "next/link";
import { getDb, schema } from "@/db";
import { AUTOMATIONS } from "@/lib/data";
import { getSession } from "@/lib/auth";
import { getReviewForGuesthouse } from "@/lib/reviews";
import { getGuesthouse } from "@/lib/stripe";
import { listMessages } from "@/lib/store";

const REAL_GUEST_PREFIXES = ["web-", "em-", "wa-"];

export default async function DashboardPage() {
  const session = await getSession();
  const messages = session ? await listMessages(session.guesthouseId) : [];
  const gh = session ? await getGuesthouse(session.guesthouseId) : null;

  const db = await getDb();
  const invitedCount = session
    ? (
        await db
          .select({ id: schema.guesthouses.id })
          .from(schema.guesthouses)
          .where(eq(schema.guesthouses.referredBy, session.guesthouseId))
      ).length
    : 0;
  const review = session
    ? await getReviewForGuesthouse(session.guesthouseId)
    : null;

  const hasRealEnquiry = messages.some((m) =>
    REAL_GUEST_PREFIXES.some((p) => m.id.startsWith(p)),
  );
  const hasReplied = messages.some((m) => m.id.startsWith("out-"));
  const steps = [
    {
      done: true,
      title: "Create your account",
      detail: "Done — welcome to Meckvy.",
      href: null,
      cta: null,
    },
    {
      done: hasRealEnquiry,
      title: "Put Meckvy where guests can find you",
      detail:
        "Share your link or QR on Instagram, Facebook and Google Maps — or add the chat button to your website. No developer needed.",
      href: "/dashboard/connect",
      cta: "Connect in 2 minutes",
    },
    {
      done: hasRealEnquiry,
      title: "Receive your first guest enquiry",
      detail: "Open your own Meckvy page and send a test message to see it arrive.",
      href: "/dashboard/connect",
      cta: "Send a test",
    },
    {
      done: hasReplied,
      title: "Reply from the inbox",
      detail: "Use a template and translation to answer in seconds.",
      href: "/dashboard/inbox",
      cta: "Open inbox",
    },
    {
      done: invitedCount > 0,
      title: "Invite a guesthouse friend",
      detail: "You both get a free month when they join.",
      href: "/dashboard/invite",
      cta: "Invite & earn",
    },
    {
      done: Boolean(review),
      title: "Leave a review",
      detail: "Help other guesthouses discover Meckvy.",
      href: "/dashboard/review",
      cta: "Write a review",
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const progress = Math.round((doneCount / steps.length) * 100);
  const plan = gh?.plan ?? session?.plan ?? "—";
  const planStatus = gh?.planStatus ?? "trialing";
  const unread = messages.filter((m) => m.status === "unread").length;
  const activeAutos = AUTOMATIONS.filter((a) => a.enabled).length;
  const channels = {
    website: messages.filter((m) => m.channel === "website").length,
    whatsapp: messages.filter((m) => m.channel === "whatsapp").length,
    email: messages.filter((m) => m.channel === "email").length,
  };

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">
          Overview
        </h1>
        <p className="mt-1 text-ink-soft">
          {session
            ? `${session.guesthouseName} · ${plan} · ${planStatus}`
            : "Your guesthouse communications at a glance."}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Unread messages",
            value: String(unread),
            href: "/dashboard/inbox",
          },
          {
            label: "Active automations",
            value: String(activeAutos),
            href: "/dashboard/automations",
          },
          {
            label: "Plan",
            value: `${plan}${planStatus === "active" ? " ✓" : ""}`,
            href: "/pricing",
          },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-2xl border border-line bg-foam px-5 py-5 transition hover:border-lagoon/40"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">
              {stat.label}
            </p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold capitalize text-lagoon-deep">
              {stat.value}
            </p>
          </Link>
        ))}
      </div>

      {doneCount < steps.length && (
        <section className="mt-6 rounded-2xl border border-line bg-foam p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold text-ink">Getting started</h2>
            <p className="text-sm text-ink-soft">
              {doneCount} of {steps.length} done
            </p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-sand">
            <div
              className="h-full rounded-full bg-lagoon transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <ol className="mt-5 space-y-3">
            {steps.map((step, i) => (
              <li
                key={step.title}
                className={`flex flex-wrap items-center gap-4 rounded-xl border px-4 py-3 ${
                  step.done ? "border-line bg-sand/40" : "border-lagoon/25"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    step.done ? "bg-lagoon text-foam" : "bg-sand text-ink"
                  }`}
                >
                  {step.done ? "✓" : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={`font-medium ${step.done ? "text-ink-soft line-through" : "text-ink"}`}
                  >
                    {step.title}
                  </p>
                  {!step.done && (
                    <p className="text-sm text-ink-soft">{step.detail}</p>
                  )}
                </div>
                {!step.done && step.href && (
                  <Link
                    href={step.href}
                    className="btn-lift rounded-full bg-lagoon px-4 py-2 text-sm font-semibold text-foam hover:bg-lagoon-deep"
                  >
                    {step.cta}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {planStatus !== "active" && (
        <section className="mt-6 rounded-2xl border border-coral/30 bg-foam p-5">
          <p className="text-sm text-ink-soft">
            {planStatus === "trialing"
              ? "You’re on a free trial. Next step: share your Meckvy link or add the chat button to your website so guest enquiries start arriving here."
              : `Your subscription is ${planStatus}. Contact us to renew — we invoice monthly by BML bank transfer.`}
          </p>
          <Link
            href="/dashboard/connect"
            className="mt-3 inline-flex rounded-full bg-coral px-5 py-2 text-sm font-semibold text-foam"
          >
            Connect your website
          </Link>
        </section>
      )}

      <section className="mt-10 rounded-2xl border border-line bg-foam p-6">
        <h2 className="text-lg font-semibold text-ink">Your inbox</h2>
        <p className="mt-1 text-sm text-ink-soft">
          {channels.website} website · {channels.email} email ·{" "}
          {channels.whatsapp} WhatsApp — this guesthouse only.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/dashboard/inbox"
            className="inline-flex rounded-full bg-lagoon px-5 py-2.5 text-sm font-semibold text-foam hover:bg-lagoon-deep"
          >
            Open inbox
          </Link>
          <Link
            href="/dashboard/connect"
            className="inline-flex rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink hover:bg-sand"
          >
            Connect website
          </Link>
        </div>
      </section>
    </div>
  );
}
