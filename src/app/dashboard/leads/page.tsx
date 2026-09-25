"use client";

import { useCallback, useEffect, useState } from "react";

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
};

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

  const load = useCallback(async () => {
    const res = await fetch("/api/leads");
    if (res.status === 403) {
      setForbidden(true);
      return;
    }
    const data = (await res.json()) as {
      leads: Lead[];
      accounts: Account[];
      reviews: Review[];
    };
    setLeads(data.leads);
    setAccounts(data.accounts);
    setReviews(data.reviews);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
        This page is only for the Meckvy owner.
      </div>
    );
  }

  const nameById = new Map(accounts.map((a) => [a.id, a.name]));
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
          Guesthouse accounts ({accounts.length})
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Referral reward: both the new guesthouse and the one who invited them
          get one free month on their invoice.
        </p>
        <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-foam">
          {accounts.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3 text-sm">
              <span className="font-semibold text-ink">{a.name}</span>
              <span className="text-ink-soft">{a.island}</span>
              <span className="rounded-full bg-sand px-2 py-0.5 text-xs capitalize text-ink-soft">
                {a.plan} · {a.planStatus}
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
