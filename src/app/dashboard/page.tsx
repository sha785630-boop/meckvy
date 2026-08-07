import Link from "next/link";
import { AUTOMATIONS } from "@/lib/data";
import { getSession } from "@/lib/auth";
import { getGuesthouse } from "@/lib/stripe";
import { listMessages } from "@/lib/store";

export default async function DashboardPage() {
  const session = await getSession();
  const messages = session ? await listMessages(session.guesthouseId) : [];
  const gh = session ? await getGuesthouse(session.guesthouseId) : null;
  const plan = gh?.plan ?? session?.plan ?? "—";
  const planStatus = gh?.planStatus ?? "trialing";
  const unread = messages.filter((m) => m.status === "unread").length;
  const activeAutos = AUTOMATIONS.filter((a) => a.enabled).length;
  const channels = {
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

      {planStatus !== "active" && (
        <section className="mt-6 rounded-2xl border border-coral/30 bg-foam p-5">
          <p className="text-sm text-ink-soft">
            Your subscription is{" "}
            <span className="font-medium text-ink">{planStatus}</span>.
            Subscribe on the pricing page to activate card billing.
          </p>
          <Link
            href="/pricing"
            className="mt-3 inline-flex rounded-full bg-coral px-5 py-2 text-sm font-semibold text-foam"
          >
            Subscribe with Stripe
          </Link>
        </section>
      )}

      <section className="mt-10 rounded-2xl border border-line bg-foam p-6">
        <h2 className="text-lg font-semibold text-ink">Your inbox</h2>
        <p className="mt-1 text-sm text-ink-soft">
          {channels.whatsapp} WhatsApp · {channels.email} email messages for this
          guesthouse only.
        </p>
        <Link
          href="/dashboard/inbox"
          className="mt-5 inline-flex rounded-full bg-lagoon px-5 py-2.5 text-sm font-semibold text-foam hover:bg-lagoon-deep"
        >
          Open inbox
        </Link>
      </section>
    </div>
  );
}
