import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { DEMO_GUESTHOUSE_ID, getDb, schema } from "@/db";
import { getSession } from "@/lib/auth";
import { isPlanId, paymentReference, priceFor } from "@/lib/billing";
import { notifyAdmins } from "@/lib/owner-push";

export const runtime = "nodejs";

const MAX_BASE64_LENGTH = 1_400_000;

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.guesthouseId === DEMO_GUESTHOUSE_ID) {
    return NextResponse.json(
      { error: "The demo account can’t make payments — create your own free account." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    plan?: unknown;
    months?: unknown;
    dataUrl?: string;
  } | null;
  if (!isPlanId(body?.plan)) {
    return NextResponse.json({ error: "Pick a plan." }, { status: 400 });
  }
  const price = priceFor(body.plan, Number(body.months));
  if (!price) {
    return NextResponse.json({ error: "Pick how many months." }, { status: 400 });
  }
  const match = body.dataUrl?.match(/^data:(image\/(?:jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    return NextResponse.json(
      { error: "Please add a photo or screenshot of your transfer slip." },
      { status: 400 },
    );
  }
  const [, mime, data] = match;
  if (data.length > MAX_BASE64_LENGTH) {
    return NextResponse.json({ error: "That image is too large." }, { status: 413 });
  }

  const db = await getDb();
  const pending = await db
    .select({ id: schema.payments.id })
    .from(schema.payments)
    .where(
      and(
        eq(schema.payments.guesthouseId, session.guesthouseId),
        eq(schema.payments.status, "pending"),
      ),
    )
    .limit(1);
  if (pending[0]) {
    return NextResponse.json(
      { error: "We’re still checking your last slip — you’ll get a notification soon." },
      { status: 409 },
    );
  }

  const reference = paymentReference(session.guesthouseId);
  await db.insert(schema.payments).values({
    id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    guesthouseId: session.guesthouseId,
    plan: body.plan,
    months: price.term.months,
    amountMvr: price.mvr,
    amountUsd: price.usd,
    reference,
    slipMime: mime,
    slipData: data,
    status: "pending",
    createdAt: new Date().toISOString(),
  });

  await notifyAdmins({
    title: `💳 Payment slip from ${session.guesthouseName}`,
    body: `${body.plan} · ${price.term.label} · MVR ${price.mvr.toLocaleString()} (${reference})`,
    url: "/dashboard/leads",
  });

  return NextResponse.json({ ok: true });
}
