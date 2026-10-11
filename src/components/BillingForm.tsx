"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  BILLING_PLANS,
  BILLING_TERMS,
  priceFor,
  type BankDetails,
} from "@/lib/billing-plans";
import { compressImage } from "@/lib/compress-image";
import type { PlanId } from "@/lib/leads";

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line py-2.5 first:border-t-0">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
        <p className="truncate font-mono text-sm text-ink">{value}</p>
      </div>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          });
        }}
        className="shrink-0 rounded-full border border-line px-3 py-1 text-xs font-medium text-lagoon-deep hover:bg-sand"
      >
        {copied ? "Copied ✓" : "Copy"}
      </button>
    </div>
  );
}

export function BillingForm({
  initialPlan,
  reference,
  bank,
}: {
  initialPlan: PlanId;
  reference: string;
  bank: BankDetails | null;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [plan, setPlan] = useState<PlanId>(initialPlan);
  const [months, setMonths] = useState<number>(1);
  const [slip, setSlip] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const price = priceFor(plan, months);

  async function pickFile(file: File | undefined) {
    if (!file) return;
    setError("");
    try {
      setSlip(await compressImage(file, 1800, 0.85));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that image.");
    }
  }

  async function submit() {
    if (!slip) {
      setError("Add a photo or screenshot of your transfer slip first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/billing/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, months, dataUrl: slip }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not send your slip. Try again.");
        return;
      }
      router.refresh();
    } catch {
      setError("No connection — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-6">
        <section className="rounded-2xl border border-line bg-foam p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-lagoon-mist text-sm text-lagoon-deep">
              1
            </span>
            Choose your plan
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(Object.keys(BILLING_PLANS) as PlanId[]).map((id) => {
              const p = BILLING_PLANS[id];
              const active = plan === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPlan(id)}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    active
                      ? "border-lagoon bg-lagoon-mist/30 ring-2 ring-lagoon/30"
                      : "border-line bg-white/70 hover:border-lagoon/40"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold text-ink">{p.name}</span>
                    <span className="font-[family-name:var(--font-display)] text-lg text-lagoon-deep">
                      MVR {p.mvr}
                      <span className="text-xs text-ink-soft">/mo</span>
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ink-soft">{p.blurb}</p>
                  <p className="mt-1 text-[11px] text-ink-soft/80">≈ ${p.usd} USD</p>
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {BILLING_TERMS.map((t) => (
              <button
                key={t.months}
                type="button"
                onClick={() => setMonths(t.months)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  months === t.months
                    ? "bg-lagoon text-foam"
                    : "border border-line bg-white text-ink-soft hover:bg-sand"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-foam p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-lagoon-mist text-sm text-lagoon-deep">
              2
            </span>
            Transfer with BML Mobile Banking
          </h2>
          {bank ? (
            <>
              <p className="mt-2 text-sm text-ink-soft">
                Send the amount below and put <span className="font-semibold text-ink">{reference}</span>{" "}
                in the remarks so we know it’s you.
              </p>
              <div className="mt-4 rounded-xl border border-line bg-white px-4 py-1">
                <CopyRow label="Account name" value={bank.accountName} />
                {bank.accountMvr && <CopyRow label="MVR account" value={bank.accountMvr} />}
                {bank.accountUsd && <CopyRow label="USD account" value={bank.accountUsd} />}
                <CopyRow label="Remarks / reference" value={reference} />
              </div>
              <p className="mt-2 text-xs text-ink-soft">{bank.bankName}</p>
            </>
          ) : (
            <p className="mt-2 rounded-xl bg-sand px-4 py-3 text-sm text-ink-soft">
              Our bank details are being set up — send your slip once they appear here, or
              message us and we’ll send them to you. Your reference is{" "}
              <span className="font-semibold text-ink">{reference}</span>.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-line bg-foam p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-lagoon-mist text-sm text-lagoon-deep">
              3
            </span>
            Upload your transfer slip
          </h2>
          <p className="mt-2 text-sm text-ink-soft">
            A screenshot of the BML confirmation screen is perfect.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void pickFile(e.target.files?.[0])}
          />
          {slip ? (
            <div className="mt-4 flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slip}
                alt="Your transfer slip"
                className="h-28 w-20 rounded-xl border border-line object-cover"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink-soft hover:bg-sand"
              >
                Change image
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-4 flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-lagoon/30 bg-lagoon-mist/15 px-4 py-8 text-sm text-lagoon-deep transition hover:bg-lagoon-mist/30"
            >
              <span className="text-2xl">🧾</span>
              <span className="mt-1 font-semibold">Add slip photo or screenshot</span>
            </button>
          )}
        </section>
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-2xl border border-line bg-foam p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">To pay</p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-4xl font-semibold text-ink">
            MVR {price?.mvr.toLocaleString()}
          </p>
          <p className="text-sm text-ink-soft">
            or ${price?.usd} USD · {BILLING_PLANS[plan].name} · {price?.term.label}
          </p>
          {months === 12 && (
            <p className="mt-2 inline-flex rounded-full bg-coral/15 px-3 py-1 text-xs font-semibold text-coral">
              You save MVR {(BILLING_PLANS[plan].mvr * 2).toLocaleString()}
            </p>
          )}
          <button
            type="button"
            disabled={busy || !slip}
            onClick={() => void submit()}
            className="btn-lift mt-5 w-full rounded-full bg-coral py-3 text-sm font-semibold text-foam hover:brightness-110 disabled:opacity-50"
          >
            {busy ? "Sending…" : "I’ve paid — send slip"}
          </button>
          {error && (
            <p className="mt-3 text-sm text-coral" role="alert">
              {error}
            </p>
          )}
          <p className="mt-4 text-xs text-ink-soft">
            We check slips within a few hours and your plan switches on automatically.
          </p>
        </div>
      </aside>
    </div>
  );
}
