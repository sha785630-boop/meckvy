import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  activateGuesthouseSubscription,
  getStripe,
  isStripeConfigured,
  markGuesthouseCanceled,
} from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const body = await request.text();

  let event: Stripe.Event;

  try {
    if (webhookSecret) {
      const signature = request.headers.get("stripe-signature");
      if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 400 });
      }
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // Local/dev without webhook signing (not for production)
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Webhook signature verification failed",
      },
      { status: 400 },
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const guesthouseId = session.metadata?.guesthouseId;
      const plan = session.metadata?.plan || "starter";
      if (guesthouseId) {
        await activateGuesthouseSubscription({
          guesthouseId,
          plan,
          customerId:
            typeof session.customer === "string" ? session.customer : null,
          subscriptionId:
            typeof session.subscription === "string"
              ? session.subscription
              : null,
        });
      }
    }

    if (
      event.type === "customer.subscription.deleted" ||
      event.type === "customer.subscription.updated"
    ) {
      const sub = event.data.object as Stripe.Subscription;
      if (event.type === "customer.subscription.deleted") {
        await markGuesthouseCanceled(sub.id);
      } else if (sub.status === "active" || sub.status === "trialing") {
        const guesthouseId = sub.metadata?.guesthouseId;
        const plan = sub.metadata?.plan || "starter";
        if (guesthouseId) {
          await activateGuesthouseSubscription({
            guesthouseId,
            plan,
            customerId:
              typeof sub.customer === "string" ? sub.customer : null,
            subscriptionId: sub.id,
          });
        }
      } else if (
        sub.status === "canceled" ||
        sub.status === "unpaid" ||
        sub.status === "past_due"
      ) {
        await markGuesthouseCanceled(sub.id);
      }
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
