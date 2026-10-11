import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { BankDetails } from "@/lib/billing-plans";

export {
  BILLING_PLANS,
  BILLING_TERMS,
  isPlanId,
  priceFor,
  type BankDetails,
} from "@/lib/billing-plans";

const DAY = 86_400_000;

export const TRIAL_DAYS = 14;
export const REFERRAL_BONUS_DAYS = 30;

export function initialTrialEnd(referred: boolean) {
  const days = TRIAL_DAYS + (referred ? REFERRAL_BONUS_DAYS : 0);
  return new Date(Date.now() + days * DAY).toISOString();
}

export function paymentReference(guesthouseId: string) {
  return `MKV-${guesthouseId.replace(/[^a-z0-9]/gi, "").slice(-6).toUpperCase()}`;
}

export type BillingKind = "demo" | "trial" | "active" | "due";

export type BillingState = {
  kind: BillingKind;
  endsAt: string | null;
  daysLeft: number;
};

export function billingState(gh: {
  plan: string;
  trialEndsAt: string | null;
  paidUntil: string | null;
  createdAt: string;
}): BillingState {
  if (gh.plan === "demo") return { kind: "demo", endsAt: null, daysLeft: 0 };
  const now = Date.now();
  const left = (iso: string) => Math.max(0, Math.ceil((Date.parse(iso) - now) / DAY));

  if (gh.paidUntil && Date.parse(gh.paidUntil) > now) {
    return { kind: "active", endsAt: gh.paidUntil, daysLeft: left(gh.paidUntil) };
  }
  const trialEnd =
    gh.trialEndsAt ?? new Date(Date.parse(gh.createdAt) + TRIAL_DAYS * DAY).toISOString();
  if (Date.parse(trialEnd) > now) {
    return { kind: "trial", endsAt: trialEnd, daysLeft: left(trialEnd) };
  }
  return { kind: "due", endsAt: gh.paidUntil ?? trialEnd, daysLeft: 0 };
}

const EMPTY_BANK: BankDetails = {
  bankName: "Bank of Maldives (BML)",
  accountName: "",
  accountMvr: "",
  accountUsd: "",
  contact: "",
};

export async function getBankDetails(): Promise<BankDetails> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.appSettings)
    .where(eq(schema.appSettings.key, "bank"))
    .limit(1);
  if (!rows[0]) return EMPTY_BANK;
  try {
    return { ...EMPTY_BANK, ...(JSON.parse(rows[0].value) as Partial<BankDetails>) };
  } catch {
    return EMPTY_BANK;
  }
}

export function bankIsSet(bank: BankDetails) {
  return Boolean(bank.accountName && (bank.accountMvr || bank.accountUsd));
}

export async function saveBankDetails(input: Partial<BankDetails>) {
  const clean = (v: unknown, max = 80) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const bank: BankDetails = {
    bankName: clean(input.bankName) || EMPTY_BANK.bankName,
    accountName: clean(input.accountName),
    accountMvr: clean(input.accountMvr, 40),
    accountUsd: clean(input.accountUsd, 40),
    contact: clean(input.contact),
  };
  const db = await getDb();
  const now = new Date().toISOString();
  await db
    .insert(schema.appSettings)
    .values({ key: "bank", value: JSON.stringify(bank), updatedAt: now })
    .onConflictDoUpdate({
      target: schema.appSettings.key,
      set: { value: JSON.stringify(bank), updatedAt: now },
    });
  return bank;
}

const PAYMENT_FIELDS = {
  id: schema.payments.id,
  guesthouseId: schema.payments.guesthouseId,
  plan: schema.payments.plan,
  months: schema.payments.months,
  amountMvr: schema.payments.amountMvr,
  amountUsd: schema.payments.amountUsd,
  reference: schema.payments.reference,
  status: schema.payments.status,
  note: schema.payments.note,
  createdAt: schema.payments.createdAt,
  reviewedAt: schema.payments.reviewedAt,
};

export type PaymentSummary = {
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
  reviewedAt: string | null;
};

export async function listPayments(guesthouseId?: string): Promise<PaymentSummary[]> {
  const db = await getDb();
  const q = db.select(PAYMENT_FIELDS).from(schema.payments);
  return (guesthouseId ? q.where(eq(schema.payments.guesthouseId, guesthouseId)) : q)
    .orderBy(desc(schema.payments.createdAt))
    .limit(200);
}

export async function getGuesthouseRow(id: string) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.guesthouses)
    .where(eq(schema.guesthouses.id, id))
    .limit(1);
  return rows[0];
}

/** Extends from whichever is later: now, current paid-until, or trial end. */
function addFrom(base: (string | null)[], days: number) {
  const start = Math.max(Date.now(), ...base.map((b) => (b ? Date.parse(b) : 0)));
  return new Date(start + days * DAY).toISOString();
}

export async function approvePayment(paymentId: string) {
  const db = await getDb();
  const [payment] = await db
    .select(PAYMENT_FIELDS)
    .from(schema.payments)
    .where(eq(schema.payments.id, paymentId))
    .limit(1);
  if (!payment || payment.status !== "pending") return null;
  const gh = await getGuesthouseRow(payment.guesthouseId);
  if (!gh) return null;

  const paidUntil = addFrom([gh.paidUntil, gh.trialEndsAt], payment.months * 30);
  await db
    .update(schema.guesthouses)
    .set({ plan: payment.plan, planStatus: "active", paidUntil })
    .where(eq(schema.guesthouses.id, gh.id));
  await db
    .update(schema.payments)
    .set({ status: "approved", reviewedAt: new Date().toISOString() })
    .where(eq(schema.payments.id, paymentId));
  return { guesthouseId: gh.id, paidUntil };
}

export async function rejectPayment(paymentId: string, note: string) {
  const db = await getDb();
  const [payment] = await db
    .select(PAYMENT_FIELDS)
    .from(schema.payments)
    .where(eq(schema.payments.id, paymentId))
    .limit(1);
  if (!payment || payment.status !== "pending") return null;
  await db
    .update(schema.payments)
    .set({
      status: "rejected",
      note: note.trim().slice(0, 300) || null,
      reviewedAt: new Date().toISOString(),
    })
    .where(eq(schema.payments.id, paymentId));
  return { guesthouseId: payment.guesthouseId };
}

/** Free days (referral rewards, goodwill): extends paid time if active, otherwise the trial. */
export async function grantFreeDays(guesthouseId: string, days: number) {
  const gh = await getGuesthouseRow(guesthouseId);
  if (!gh) return null;
  const db = await getDb();
  const state = billingState(gh);
  if (state.kind === "active") {
    const paidUntil = addFrom([gh.paidUntil], days);
    await db
      .update(schema.guesthouses)
      .set({ paidUntil })
      .where(eq(schema.guesthouses.id, gh.id));
    return { paidUntil };
  }
  const trialEndsAt = addFrom([gh.trialEndsAt], days);
  await db
    .update(schema.guesthouses)
    .set({ trialEndsAt, planStatus: "trialing" })
    .where(eq(schema.guesthouses.id, gh.id));
  return { trialEndsAt };
}
