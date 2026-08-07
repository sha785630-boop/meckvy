import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  activateGuesthouseSubscription,
  getStripe,
  isStripeConfigured,
} from "@/lib/stripe";

export const runtime = "nodejs";

/** Confirm checkout after redirect (useful when local webhook isn't set up) */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  try {
    const body = (await request.json()) as { sessionId?: string };
    if (!body.sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    const checkout = await stripe.checkout.sessions.retrieve(body.sessionId);
    if (checkout.payment_status !== "paid" && checkout.status !== "complete") {
      return NextResponse.json(
        { error: "Payment not completed yet" },
        { status: 400 },
      );
    }

    const guesthouseId =
      checkout.metadata?.guesthouseId || session.guesthouseId;
    const plan = checkout.metadata?.plan || "starter";

    if (guesthouseId !== session.guesthouseId) {
      return NextResponse.json({ error: "Session mismatch" }, { status: 403 });
    }

    await activateGuesthouseSubscription({
      guesthouseId,
      plan,
      customerId:
        typeof checkout.customer === "string" ? checkout.customer : null,
      subscriptionId:
        typeof checkout.subscription === "string"
          ? checkout.subscription
          : null,
    });

    return NextResponse.json({
      ok: true,
      plan,
      planStatus: "active",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Confirm failed" },
      { status: 500 },
    );
  }
}
