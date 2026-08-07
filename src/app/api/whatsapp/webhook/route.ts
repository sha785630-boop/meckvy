import { NextResponse } from "next/server";
import { resolveInboundGuesthouseId } from "@/lib/auth";
import { upsertInbound } from "@/lib/store";
import {
  getWhatsAppConfig,
  parseIncomingWhatsApp,
  toGuestMessage,
} from "@/lib/whatsapp";

export const runtime = "nodejs";

/** Meta webhook verification */
export async function GET(request: Request) {
  const config = getWhatsAppConfig();
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (!config) {
    return NextResponse.json(
      { error: "WhatsApp not configured" },
      { status: 503 },
    );
  }

  if (mode === "subscribe" && token === config.verifyToken && challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

/** Inbound WhatsApp messages */
export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as unknown;
    const incoming = parseIncomingWhatsApp(
      payload as Parameters<typeof parseIncomingWhatsApp>[0],
    );
    const guesthouseId = resolveInboundGuesthouseId();

    const saved = await Promise.all(
      incoming.map((msg) => upsertInbound(guesthouseId, toGuestMessage(msg))),
    );

    return NextResponse.json({ ok: true, received: saved.length });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
