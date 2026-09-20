import { NextResponse } from "next/server";
import { getVapidPublicKey } from "@/lib/shield/push";
import { getOrCreateClient, savePushSubscription } from "@/lib/shield/store";

export async function GET() {
  return NextResponse.json({ publicKey: getVapidPublicKey() });
}

export async function POST(request: Request) {
  let body: {
    clientId?: string;
    subscription?: {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    };
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const clientId = body.clientId?.trim();
  const subscription = body.subscription;

  if (!clientId || !subscription?.endpoint || !subscription.keys) {
    return NextResponse.json(
      { error: "clientId and subscription required" },
      { status: 400 },
    );
  }

  await getOrCreateClient(clientId);
  await savePushSubscription(clientId, subscription);

  return NextResponse.json({ ok: true });
}
