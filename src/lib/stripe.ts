import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { PlanId } from "@/lib/leads";

export const PLAN_PRICES: Record<
  PlanId,
  { name: string; amountUsd: number; description: string }
> = {
  starter: {
    name: "Meckvy Starter",
    amountUsd: 29,
    description: "WhatsApp inbox + translation",
  },
  pro: {
    name: "Meckvy Pro",
    amountUsd: 59,
    description: "WhatsApp + email + automations",
  },
};

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key);
}

export function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://127.0.0.1:3000"
  );
}

export async function createCheckoutSession(input: {
  plan: PlanId;
  guesthouseId: string;
  customerEmail: string;
  guesthouseName: string;
}) {
  const stripe = getStripe();
  if (!stripe) {
    throw new Error("Stripe is not configured (STRIPE_SECRET_KEY)");
  }

  const plan = PLAN_PRICES[input.plan];
  const appUrl = getAppUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: input.customerEmail,
    success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/billing/cancel`,
    metadata: {
      guesthouseId: input.guesthouseId,
      plan: input.plan,
    },
    subscription_data: {
      metadata: {
        guesthouseId: input.guesthouseId,
        plan: input.plan,
      },
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: plan.amountUsd * 100,
          recurring: { interval: "month" },
          product_data: {
            name: plan.name,
            description: `${plan.description} · ${input.guesthouseName}`,
          },
        },
      },
    ],
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL");
  }

  return session;
}

export async function activateGuesthouseSubscription(input: {
  guesthouseId: string;
  plan: string;
  customerId?: string | null;
  subscriptionId?: string | null;
}) {
  const db = await getDb();
  await db
    .update(schema.guesthouses)
    .set({
      plan: input.plan,
      planStatus: "active",
      stripeCustomerId: input.customerId ?? null,
      stripeSubscriptionId: input.subscriptionId ?? null,
    })
    .where(eq(schema.guesthouses.id, input.guesthouseId));
}

export async function markGuesthouseCanceled(subscriptionId: string) {
  const db = await getDb();
  await db
    .update(schema.guesthouses)
    .set({ planStatus: "canceled" })
    .where(eq(schema.guesthouses.stripeSubscriptionId, subscriptionId));
}

export async function getGuesthouse(id: string) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.guesthouses)
    .where(eq(schema.guesthouses.id, id))
    .limit(1);
  return rows[0];
}
