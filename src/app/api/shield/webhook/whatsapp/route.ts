import { NextResponse } from "next/server";
import { formatScanForChat, scanText } from "@/lib/shield/scan";
import {
  getWhatsAppConfig,
  parseIncomingWhatsApp,
  sendWhatsAppText,
} from "@/lib/whatsapp";

export const runtime = "nodejs";

/** Meta webhook verification for LinkShield bot */
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

/** Scan links from inbound WhatsApp messages and reply with results */
export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as unknown;
    const incoming = parseIncomingWhatsApp(
      payload as Parameters<typeof parseIncomingWhatsApp>[0],
    );

    await Promise.all(
      incoming.map(async (msg) => {
        const result = await scanText(msg.text);
        const reply = formatScanForChat(result);
        await sendWhatsAppText(msg.from, reply);
      }),
    );

    return NextResponse.json({ ok: true, processed: incoming.length });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
