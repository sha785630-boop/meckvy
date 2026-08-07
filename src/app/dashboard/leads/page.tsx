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

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/leads");
    const data = (await res.json()) as { leads: Lead[] };
    setLeads(data.leads);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">
          Signups
        </h1>
        <p className="mt-1 text-ink-soft">
          Guesthouses who requested access from the pricing page. Stored in
          SQLite (<code className="text-xs">data/meckvy.db</code>).
        </p>
      </header>

      {leads.length === 0 ? (
        <p className="rounded-2xl border border-line bg-foam px-5 py-8 text-sm text-ink-soft">
          No signups yet. Share{" "}
          <a href="/pricing" className="text-lagoon-deep underline">
            /pricing
          </a>{" "}
          with guesthouse owners.
        </p>
      ) : (
        <ul className="space-y-3">
          {leads.map((lead) => (
            <li
              key={lead.id}
              className="rounded-2xl border border-line bg-foam px-5 py-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold text-ink">{lead.guesthouseName}</h2>
                <span className="rounded-full bg-lagoon-mist/70 px-2.5 py-0.5 text-xs font-medium capitalize text-lagoon-deep">
                  {lead.plan}
                </span>
                <span className="text-xs text-ink-soft">{lead.island}</span>
              </div>
              <p className="mt-2 text-sm text-ink-soft">
                {lead.contactName} · {lead.email} · {lead.phone}
              </p>
              {lead.notes && (
                <p className="mt-2 text-sm text-ink">{lead.notes}</p>
              )}
              <p className="mt-2 text-xs text-ink-soft">
                {new Date(lead.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
