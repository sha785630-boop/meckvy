"use client";

import { useCallback, useEffect, useState } from "react";
import { CopyButton } from "@/components/CopyButton";

type Lead = {
  id: string;
  guesthouseName: string;
  island: string;
  contactName: string;
  email: string;
  phone: string;
  plan: string;
  createdAt: string;
  notes: string | null;
};

type Account = {
  id: string;
  name: string;
  island: string;
  plan: string;
  planStatus: string;
  referredBy: string | null;
  createdAt: string;
  ownerEmail: string | null;
  billing: { kind: string; endsAt: string | null; daysLeft: number };
};

type ResetResult = { guesthouse: string; email: string; password: string };

type Payment = {
  id: string;
  guesthouseId: string;
  plan: string;
  months: number;
  amountMvr: number;
  amountUsd: number;
  reference: string;
  status: string;
  note: string | null;
  createdAt: string;
};

type Bank = {
  bankName: string;
  accountName: string;
  accountMvr: string;
  accountUsd: string;
  contact: string;
};

const BILLING_BADGE: Record<string, string> = {
  trial: "bg-lagoon-mist/60 text-lagoon-deep",
  active: "bg-emerald-100 text-emerald-900",
  due: "bg-coral/15 text-coral",
  demo: "bg-sand text-ink-soft",
};

type AdminData = {
  leads: Lead[];
  accounts: Account[];
  reviews: Review[];
  billing: { payments: Payment[]; bank: Bank } | null;
} | null;

async function fetchAdminData(): Promise<AdminData> {
  const [res, billingRes] = await Promise.all([
    fetch("/api/leads"),
    fetch("/api/admin/billing"),
  ]);
  if (res.status === 403) return null;
  const data = (await res.json()) as Omit<NonNullable<AdminData>, "billing">;
  const billing = billingRes.ok
    ? ((await billingRes.json()) as { payments: Payment[]; bank: Bank })
    : null;
  return { ...data, billing };
}

function shortDate(iso: string | null) {
  return iso
    ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    : "";
}

type Review = {
  id: string;
  authorName: string;
  guesthouseName: string;
  island: string;
  rating: number;
  body: string;
  hidden: number;
  updatedAt: string;
};

export default function AdminPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [forbidden, setForbidden] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [bank, setBank] = useState<Bank | null>(null);
  const [bankSaved, setBankSaved] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [resetResult, setResetResult] = useState<ResetResult | null>(null);

  async function resetPassword(a: Account) {
    if (!confirm(`Reset the password for ${a.name}${a.ownerEmail ? ` (${a.ownerEmail})` : ""}? Their old password will stop working.`)) {
      return;
    }
    setBusyId(`pw-${a.id}`);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset-password", guesthouseId: a.id }),
      });
      const data = (await res.json()) as { ok?: boolean; email?: string; password?: string; error?: string };
      if (!res.ok || !data.password || !data.email) {
        alert(data.error ?? "Could not reset the password");
        return;
      }
      setResetResult({ guesthouse: a.name, email: data.email, password: data.password });
    } finally {
      setBusyId("");
    }
  }

  const apply = useCallback((data: AdminData) => {
    if (!data) {
      setForbidden(true);
      return;
    }
    setLeads(data.leads);
    setAccounts(data.accounts);
    setReviews(data.reviews);
    if (data.billing) {
      setPayments(data.billing.payments);
      const savedBank = data.billing.bank;
      setBank((current) => current ?? savedBank);
    }
  }, []);

  const load = useCallback(() => fetchAdminData().then(apply), [apply]);

  async function billingAction(key: string, body: Record<string, unknown>) {
    setBusyId(key);
    try {
      const res = await fetch("/api/admin/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        alert(data.error ?? "Something went wrong");
      }
      await load();
    } finally {
      setBusyId("");
    }
  }

  async function saveBank() {
    if (!bank) return;
    await billingAction("bank", { action: "bank", bank });
    setBankSaved(true);
    setTimeout(() => setBankSaved(false), 2000);
  }

  useEffect(() => {
    void fetchAdminData().then(apply);
  }, [apply]);

  async function toggleReview(r: Review) {
    await fetch("/api/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: r.id, hidden: !r.hidden }),
    });
    await load();
  }

  if (forbidden) {
    return (
      <div className="mx-auto max-w-4xl rounded-2xl border border-line bg-foam px-5 py-8 text-sm text-ink-soft">
        This page is only for the Meckvy admin.
      </div>
    );
  }

  const nameById = new Map(accounts.map((a) => [a.id, a.name]));
  const pendingPayments = payments.filter((p) => p.status === "pending");
  const recentPayments = payments.filter((p) => p.status !== "pending");
  const approvedTotal = recentPayments
    .filter((p) => p.status === "approved")
    .reduce((sum, p) => sum + p.amountMvr, 0);
  const referralCounts = new Map<string, number>();
  for (const a of accounts) {
    if (a.referredBy) {
      referralCounts.set(a.referredBy, (referralCounts.get(a.referredBy) ?? 0) + 1);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">
          Admin
        </h1>
        <p className="mt-1 text-ink-soft">
          Accounts, referrals, signup requests and reviews across all
          guesthouses.
        </p>
      </header>

      <section>
        <h2 className="text-lg font-semibold text-ink">
          Payments to check ({pendingPayments.length})
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Match the slip with your BML account (amount + reference), then approve —
          the owner’s plan switches on and their phone gets a notification.
        </p>
        {pendingPayments.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-line bg-foam px-5 py-4 text-sm text-ink-soft">
            Nothing waiting. 🎉
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {pendingPayments.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap gap-4 rounded-2xl border border-amber-300 bg-amber-50/60 p-4"
              >
                <a href={`/api/billing/slips/${p.id}`} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/billing/slips/${p.id}`}
                    alt="Transfer slip"
                    className="h-32 w-24 rounded-xl border border-line bg-white object-cover"
                  />
                </a>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-semibold text-ink">
                    {nameById.get(p.guesthouseId) ?? p.guesthouseId}
                  </p>
                  <p className="mt-1 text-ink-soft">
                    <span className="capitalize">{p.plan}</span> · {p.months} month
                    {p.months === 1 ? "" : "s"}
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold text-ink">
                    MVR {p.amountMvr.toLocaleString()}{" "}
                    <span className="text-sm font-normal text-ink-soft">or ${p.amountUsd}</span>
                  </p>
                  <p className="mt-1 text-xs text-ink-soft">
                    Reference <span className="font-mono font-semibold text-ink">{p.reference}</span> ·{" "}
                    {new Date(p.createdAt).toLocaleString()}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busyId === p.id}
                      onClick={() => void billingAction(p.id, { action: "approve", id: p.id })}
                      className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      ✓ Approve — money received
                    </button>
                    <button
                      type="button"
                      disabled={busyId === p.id}
                      onClick={() => {
                        const note = prompt(
                          "Why couldn’t you confirm it? (the owner will see this)",
                          "We couldn’t find this transfer in our account — please check the amount and reference.",
                        );
                        if (note !== null) {
                          void billingAction(p.id, { action: "reject", id: p.id, note });
                        }
                      }}
                      className="rounded-full border border-line bg-white px-4 py-2 text-xs font-medium text-ink-soft hover:bg-sand disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {recentPayments.length > 0 && (
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer text-lagoon-deep">
              Past payments ({recentPayments.length}) · MVR{" "}
              {approvedTotal.toLocaleString()} received
            </summary>
            <ul className="mt-2 divide-y divide-line rounded-2xl border border-line bg-foam">
              {recentPayments.map((p) => (
                <li key={p.id} className="flex flex-wrap gap-x-3 px-4 py-2 text-xs text-ink-soft">
                  <span className="font-medium text-ink">
                    {nameById.get(p.guesthouseId) ?? p.guesthouseId}
                  </span>
                  <span className="capitalize">
                    {p.plan} · {p.months} mo · MVR {p.amountMvr.toLocaleString()}
                  </span>
                  <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                  <span
                    className={`ml-auto font-semibold ${p.status === "approved" ? "text-emerald-700" : "text-coral"}`}
                  >
                    {p.status}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      {bank && (
        <section className="rounded-2xl border border-line bg-foam p-6">
          <h2 className="text-lg font-semibold text-ink">Your bank details</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Owners see these on their Plan & billing page when they pay.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(
              [
                ["bankName", "Bank", "Bank of Maldives (BML)"],
                ["accountName", "Account name", "Your name or business name"],
                ["accountMvr", "MVR account number", "77300000000000"],
                ["accountUsd", "USD account number (optional)", "77300000000001"],
                ["contact", "Billing contact (Viber/WhatsApp)", "+960 7xx xxxx"],
              ] as const
            ).map(([key, label, placeholder]) => (
              <label key={key} className="block text-sm">
                <span className="font-medium text-ink-soft">{label}</span>
                <input
                  value={bank[key]}
                  onChange={(e) => setBank({ ...bank, [key]: e.target.value })}
                  placeholder={placeholder}
                  className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-ink outline-none ring-lagoon focus:ring-2"
                />
              </label>
            ))}
          </div>
          <button
            type="button"
            disabled={busyId === "bank"}
            onClick={() => void saveBank()}
            className="mt-4 rounded-full bg-lagoon px-5 py-2 text-sm font-semibold text-foam hover:bg-lagoon-deep disabled:opacity-50"
          >
            {bankSaved ? "Saved ✓" : "Save bank details"}
          </button>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold text-ink">
          Guesthouse accounts ({accounts.length})
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Referral reward: both the new guesthouse and the one who invited them
          get one free month on their invoice. Forgot password? Tap 🔑 to make a
          temporary one and send it to the owner.
        </p>
        {resetResult && (
          <div className="mt-4 rounded-2xl border border-emerald-300 bg-emerald-50 p-5" role="status">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="text-sm font-semibold text-ink">
                New password for {resetResult.guesthouse}
              </p>
              <button
                type="button"
                onClick={() => setResetResult(null)}
                className="text-xs text-ink-soft hover:text-ink"
              >
                Close
              </button>
            </div>
            <p className="mt-2 text-sm text-ink-soft">
              Email: <span className="font-medium text-ink">{resetResult.email}</span>
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold tracking-wide text-ink">
              {resetResult.password}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <CopyButton text={resetResult.password} label="Copy password" />
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Your DirectStay login:\nEmail: ${resetResult.email}\nTemporary password: ${resetResult.password}\n\nSign in at ${window.location.origin}/login and change it in Settings.`,
                )}`}
                target="_blank"
                rel="noreferrer"
                className="btn-lift rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white hover:brightness-95"
              >
                Send on WhatsApp
              </a>
            </div>
            <p className="mt-3 text-xs text-ink-soft">
              This is shown only once. Ask them to change it in Settings after signing in.
            </p>
          </div>
        )}
        <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-foam">
          {accounts.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3 text-sm">
              <span className="font-semibold text-ink">{a.name}</span>
              <span className="text-ink-soft">{a.island}</span>
              {a.ownerEmail && <span className="text-xs text-ink-soft">{a.ownerEmail}</span>}
              <span
                className={`rounded-full px-2 py-0.5 text-xs capitalize ${BILLING_BADGE[a.billing.kind] ?? ""}`}
              >
                {a.billing.kind === "active"
                  ? `${a.plan} · paid to ${shortDate(a.billing.endsAt)}`
                  : a.billing.kind === "trial"
                    ? `trial · ${a.billing.daysLeft}d left`
                    : a.billing.kind === "due"
                      ? "trial ended"
                      : a.plan}
              </span>
              {a.referredBy && (
                <span className="rounded-full bg-lagoon-mist/60 px-2 py-0.5 text-xs text-lagoon-deep">
                  invited by {nameById.get(a.referredBy) ?? a.referredBy}
                </span>
              )}
              {(referralCounts.get(a.id) ?? 0) > 0 && (
                <span className="rounded-full bg-coral/15 px-2 py-0.5 text-xs text-coral">
                  invited {referralCounts.get(a.id)}
                </span>
              )}
              <span className="ml-auto text-xs text-ink-soft">
                {new Date(a.createdAt).toLocaleDateString()}
              </span>
              {a.billing.kind !== "demo" && (
                <button
                  type="button"
                  disabled={busyId === a.id}
                  title="Give 30 free days (e.g. referral reward)"
                  onClick={() => {
                    if (confirm(`Give ${a.name} 30 free days?`)) {
                      void billingAction(a.id, { action: "extend", guesthouseId: a.id, days: 30 });
                    }
                  }}
                  className="rounded-full border border-line px-2.5 py-0.5 text-xs text-lagoon-deep hover:bg-sand disabled:opacity-50"
                >
                  🎁 +30 days
                </button>
              )}
              {a.billing.kind !== "demo" && (
                <button
                  type="button"
                  disabled={busyId === `pw-${a.id}`}
                  title="Make a temporary password for this owner"
                  onClick={() => void resetPassword(a)}
                  className="rounded-full border border-line px-2.5 py-0.5 text-xs text-ink-soft hover:bg-sand disabled:opacity-50"
                >
                  🔑 Reset password
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-ink">Reviews ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">No reviews yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-2xl border border-line bg-foam px-5 py-4">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-coral">{"★".repeat(r.rating)}</span>
                  <span className="font-semibold text-ink">{r.authorName}</span>
                  <span className="text-ink-soft">
                    {r.guesthouseName}, {r.island}
                  </span>
                  <button
                    type="button"
                    onClick={() => void toggleReview(r)}
                    className="ml-auto rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-soft hover:bg-sand"
                  >
                    {r.hidden ? "Show on site" : "Hide from site"}
                  </button>
                </div>
                <p className={`mt-2 text-sm ${r.hidden ? "text-ink-soft line-through" : "text-ink"}`}>
                  {r.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-ink">
          Pricing-page requests ({leads.length})
        </h2>
        {leads.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">No requests yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {leads.map((lead) => (
              <li key={lead.id} className="rounded-2xl border border-line bg-foam px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink">{lead.guesthouseName}</span>
                  <span className="rounded-full bg-lagoon-mist/70 px-2.5 py-0.5 text-xs font-medium capitalize text-lagoon-deep">
                    {lead.plan}
                  </span>
                  <span className="text-xs text-ink-soft">{lead.island}</span>
                </div>
                <p className="mt-2 text-sm text-ink-soft">
                  {lead.contactName} · {lead.email} · {lead.phone}
                </p>
                {lead.notes && <p className="mt-2 text-sm text-ink">{lead.notes}</p>}
                <p className="mt-2 text-xs text-ink-soft">
                  {new Date(lead.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
