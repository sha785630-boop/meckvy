import Link from "next/link";
import { redirect } from "next/navigation";
import { BillingForm } from "@/components/BillingForm";
import { getSession } from "@/lib/auth";
import {
  BILLING_PLANS,
  bankIsSet,
  billingState,
  getBankDetails,
  getGuesthouseRow,
  isPlanId,
  listPayments,
  paymentReference,
} from "@/lib/billing";

export const dynamic = "force-dynamic";

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900",
  approved: "bg-emerald-100 text-emerald-900",
  rejected: "bg-coral/15 text-coral",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Checking",
  approved: "Paid",
  rejected: "Not confirmed",
};

export default async function BillingPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard/billing");
  const gh = await getGuesthouseRow(session.guesthouseId);
  if (!gh) redirect("/login");

  const state = billingState(gh);
  const payments = await listPayments(gh.id);
  const pending = payments.find((p) => p.status === "pending");
  const bank = await getBankDetails();
  const currentPlan = isPlanId(gh.plan) ? gh.plan : "starter";

  const hero = {
    demo: {
      emoji: "🧪",
      title: "This is the demo account",
      text: "Create your own free account to start a real 14-day trial.",
      tone: "from-ink to-ink-soft",
    },
    trial: {
      emoji: "🌴",
      title: `${state.daysLeft} day${state.daysLeft === 1 ? "" : "s"} left in your free trial`,
      text: `Your trial runs until ${state.endsAt ? fmt(state.endsAt) : "—"}. Pay any time — your paid months start after the trial, so you never lose free days.`,
      tone: "from-lagoon to-lagoon-deep",
    },
    active: {
      emoji: "✅",
      title: `${BILLING_PLANS[currentPlan].name} plan — paid`,
      text: `You’re all set until ${state.endsAt ? fmt(state.endsAt) : "—"} (${state.daysLeft} days). Pay again any time to add more months.`,
      tone: "from-emerald-600 to-lagoon-deep",
    },
    due: {
      emoji: "⏰",
      title: "Your free trial has ended",
      text: "Guest messages still arrive in your inbox. Pay by bank transfer below to keep replying and keep your booking page live.",
      tone: "from-coral to-[#b4533a]",
    },
  }[state.kind];

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">
          Plan & billing
        </h1>
        <p className="mt-1 text-ink-soft">
          Pay from your phone with a BML transfer — no card needed.
        </p>
      </header>

      <section
        className={`animate-fade-up rounded-3xl bg-gradient-to-br ${hero.tone} px-6 py-6 text-foam shadow-lg md:px-8`}
      >
        <p className="text-3xl">{hero.emoji}</p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold">
          {hero.title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-foam/85">{hero.text}</p>
      </section>

      {state.kind === "demo" ? (
        <div className="mt-6 rounded-2xl border border-line bg-foam p-6 text-sm text-ink-soft">
          Billing is turned off for the public demo.{" "}
          <Link href="/register" className="font-semibold text-lagoon-deep underline">
            Start your own free trial
          </Link>
        </div>
      ) : pending ? (
        <section className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-6">
          <h2 className="text-lg font-semibold text-ink">⏳ We’re checking your payment</h2>
          <p className="mt-1 text-sm text-ink-soft">
            {BILLING_PLANS[isPlanId(pending.plan) ? pending.plan : "starter"].name} ·{" "}
            {pending.months} month{pending.months === 1 ? "" : "s"} · MVR{" "}
            {pending.amountMvr.toLocaleString()} — sent {fmt(pending.createdAt)}. This usually
            takes a few hours. If you turned on alerts in{" "}
            <Link href="/dashboard/app" className="text-lagoon-deep underline">
              Get the app
            </Link>
            , your phone will ding when it’s confirmed.
          </p>
        </section>
      ) : (
        <BillingForm
          initialPlan={currentPlan}
          reference={paymentReference(gh.id)}
          bank={bankIsSet(bank) ? bank : null}
        />
      )}

      {payments.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-ink">Payment history</h2>
          <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-foam">
            {payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm">
                <span className="font-medium text-ink">{fmt(p.createdAt)}</span>
                <span className="capitalize text-ink-soft">
                  {p.plan} · {p.months} mo · MVR {p.amountMvr.toLocaleString()}
                </span>
                <a
                  href={`/api/billing/slips/${p.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-lagoon-deep underline"
                >
                  Slip
                </a>
                <span
                  className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[p.status] ?? ""}`}
                >
                  {STATUS_LABEL[p.status] ?? p.status}
                </span>
                {p.status === "rejected" && p.note && (
                  <p className="w-full text-xs text-coral">{p.note}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-8 text-xs text-ink-soft">
        Questions about billing?{" "}
        {bank.contact ? (
          <>Message us on {bank.contact}.</>
        ) : (
          <>Reply from your inbox or email sha785630@gmail.com.</>
        )}{" "}
        See our{" "}
        <Link href="/terms" className="underline">
          Terms
        </Link>
        .
      </p>
    </div>
  );
}
