import type { PlanId } from "@/lib/leads";

export const BILLING_PLANS: Record<
  PlanId,
  { name: string; usd: number; mvr: number; blurb: string }
> = {
  starter: {
    name: "Starter",
    usd: 29,
    mvr: 450,
    blurb: "Booking page, website chat button, inbox, translation",
  },
  pro: {
    name: "Pro",
    usd: 59,
    mvr: 910,
    blurb: "Everything in Starter + email replies, automations, priority help",
  },
};

/** 12 months are billed as 10 */
export const BILLING_TERMS = [
  { months: 1, billed: 1, label: "1 month" },
  { months: 3, billed: 3, label: "3 months" },
  { months: 12, billed: 10, label: "12 months · 2 free" },
] as const;

export function isPlanId(value: unknown): value is PlanId {
  return value === "starter" || value === "pro";
}

export function priceFor(plan: PlanId, months: number) {
  const term = BILLING_TERMS.find((t) => t.months === months);
  if (!term) return null;
  const p = BILLING_PLANS[plan];
  return { mvr: p.mvr * term.billed, usd: p.usd * term.billed, term };
}

export type BankDetails = {
  bankName: string;
  accountName: string;
  accountMvr: string;
  accountUsd: string;
  contact: string;
};
