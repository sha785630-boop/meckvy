import { NextResponse } from "next/server";
import { resolveInboundGuesthouseId } from "@/lib/auth";
import {
  fetchReceivingEmailBody,
  parseIncomingEmail,
  toEmailGuestMessage,
} from "@/lib/email";
import { upsertInbound } from "@/lib/store";

export const runtime = "nodejs";

/**
 * Resend inbound webhook.
 * Configure in Resend → Webhooks → email.received → this URL.
 */
export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as unknown;
    const incoming = parseIncomingEmail(payload);
    if (!incoming) {
      return NextResponse.json({ ok: true, received: 0, skipped: true });
    }

    // If webhook has no body, fetch from Resend Receiving API
    if (
      (!incoming.text || incoming.text === incoming.subject) &&
      incoming.messageId
    ) {
      const body = await fetchReceivingEmailBody(incoming.messageId);
      if (body) incoming.text = body;
    }

    const guesthouseId = resolveInboundGuesthouseId();
    await upsertInbound(guesthouseId, toEmailGuestMessage(incoming));

    return NextResponse.json({ ok: true, received: 1 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
