import { NextResponse } from "next/server";
import { DEMO_GUESTHOUSE_ID } from "@/db";
import { getSession } from "@/lib/auth";
import {
  notifyOwner,
  removeOwnerSubscription,
  saveOwnerSubscription,
} from "@/lib/owner-push";
import { getVapidPublicKey } from "@/lib/shield/push";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ publicKey: getVapidPublicKey() });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.guesthouseId === DEMO_GUESTHOUSE_ID) {
    return NextResponse.json(
      { error: "Create your own free account to get enquiry alerts on your phone." },
      { status: 403 },
    );
  }
  const body = (await request.json().catch(() => null)) as {
    subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
    test?: boolean;
  } | null;
  const sub = body?.subscription;
  if (!sub?.endpoint?.startsWith("https://") || !sub.keys?.p256dh || !sub.keys.auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }
  await saveOwnerSubscription(session.guesthouseId, {
    endpoint: sub.endpoint,
    keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
  });
  const sent = await notifyOwner(session.guesthouseId, {
    title: "🔔 Meckvy alerts are on",
    body: "You’ll get a ding like this for every new guest enquiry.",
    url: "/dashboard",
  });
  return NextResponse.json({ ok: true, sent });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as { endpoint?: string } | null;
  if (body?.endpoint) await removeOwnerSubscription(body.endpoint);
  return NextResponse.json({ ok: true });
}
