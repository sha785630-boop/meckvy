import { NextResponse } from "next/server";
import { monitorMessage } from "@/lib/shield/monitor";
import { getOrCreateClient, type ShieldPlatform } from "@/lib/shield/store";

const PLATFORMS = new Set([
  "whatsapp_web",
  "telegram_web",
  "gmail",
  "messenger",
  "instagram",
  "sms_android",
  "email_imap",
]);

function withCors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return res;
}

/** Auto-scan incoming messages from connected apps (browser extension, mobile) */
export async function POST(request: Request) {
  let body: {
    clientId?: string;
    platform?: string;
    text?: string;
    senderHint?: string;
    notifyOnSafe?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return withCors(
      NextResponse.json({ error: "Invalid JSON" }, { status: 400 }),
    );
  }

  const clientId = body.clientId?.trim();
  const platform = body.platform?.trim() as ShieldPlatform | undefined;
  const text = body.text?.trim();

  if (!clientId || !platform || !text) {
    return withCors(
      NextResponse.json(
        { error: "clientId, platform, and text are required" },
        { status: 400 },
      ),
    );
  }

  if (!PLATFORMS.has(platform)) {
    return withCors(
      NextResponse.json({ error: "Unknown platform" }, { status: 400 }),
    );
  }

  await getOrCreateClient(clientId);
  const result = await monitorMessage({
    clientId,
    platform,
    text,
    senderHint: body.senderHint,
    notifyOnSafe: body.notifyOnSafe,
  });

  const worst = result.scanned.overallRisk;

  return withCors(
    NextResponse.json({
      ok: true,
      overallRisk: worst,
      warn: worst !== "safe",
      block: worst === "dangerous",
      urls: result.scanned.urls,
      alertsCreated: result.alertsCreated.length,
      notificationsSent: result.notificationsSent,
      message: result.scanned.message,
    }),
  );
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}
