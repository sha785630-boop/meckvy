import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import type { PlanId } from "@/lib/leads";
import {
  createCheckoutSession,
  isStripeConfigured,
  PLAN_PRICES,
} from "@/lib/stripe";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    configured: isStripeConfigured(),
    plans: PLAN_PRICES,
    hint: isStripeConfigured()
      ? "Stripe is ready — use Pay on the pricing page while signed in."
      : "Add STRIPE_SECRET_KEY to .env.local (test mode sk_test_…)",
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Sign in first, then subscribe", login: "/login?next=/pricing" },
      { status: 401 },
    );
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured yet" },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as { plan?: PlanId };
    const plan = body.plan;
    if (plan !== "starter" && plan !== "pro") {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const checkout = await createCheckoutSession({
      plan,
      guesthouseId: session.guesthouseId,
      customerEmail: session.email,
      guesthouseName: session.guesthouseName,
    });

    return NextResponse.json({ ok: true, url: checkout.url });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Checkout failed",
      },
      { status: 500 },
    );
  }
}
