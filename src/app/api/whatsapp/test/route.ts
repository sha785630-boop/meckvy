import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { appendOutboundNote } from "@/lib/store";
import {
  isWhatsAppConfigured,
  normalizeWhatsAppTo,
  sendWhatsAppText,
} from "@/lib/whatsapp";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isWhatsAppConfigured()) {
    return NextResponse.json(
      {
        error:
          "WhatsApp not configured. Add WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID to .env.local",
      },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as { to?: string; text?: string };
    const to = body.to?.trim();
    const text =
      body.text?.trim() ||
      "Meckvy test: your WhatsApp Business number is connected.";

    if (!to) {
      return NextResponse.json(
        { error: "to (guest phone with country code) is required" },
        { status: 400 },
      );
    }

    const result = await sendWhatsAppText(to, text);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }

    const digits = normalizeWhatsAppTo(to);
    await appendOutboundNote(
      session.guesthouseId,
      `wa-${digits}`,
      `[WHATSAPP TEST → +${digits}]\n${text}`,
      "whatsapp",
      `+${digits}`,
    );

    return NextResponse.json({
      ok: true,
      messageId: result.messageId,
      note: "Sent via Meta WhatsApp Cloud API",
    });
  } catch {
    return NextResponse.json({ error: "Test send failed" }, { status: 500 });
  }
}
