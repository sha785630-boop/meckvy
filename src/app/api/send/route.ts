import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { appendOutboundNote } from "@/lib/store";
import { translateText } from "@/lib/translate";
import type { Channel, LanguageCode } from "@/lib/types";
import { isWhatsAppConfigured, sendWhatsAppText } from "@/lib/whatsapp";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      threadId?: string;
      channel?: Channel;
      to?: string;
      subject?: string;
      text?: string;
      fromLang?: LanguageCode;
      toLang?: LanguageCode;
      translate?: boolean;
    };

    if (!body.threadId || !body.channel || !body.to || !body.text) {
      return NextResponse.json(
        { error: "threadId, channel, to, and text are required" },
        { status: 400 },
      );
    }

    let finalText = body.text;
    let translationProvider = "none";

    if (body.translate && body.fromLang && body.toLang) {
      const result = await translateText(
        body.text,
        body.fromLang,
        body.toLang,
      );
      finalText = result.translated;
      translationProvider = result.provider;
    }

    const ghId = session.guesthouseId;

    if (body.channel === "whatsapp") {
      if (!isWhatsAppConfigured()) {
        await appendOutboundNote(
          ghId,
          body.threadId,
          `[WHATSAPP DEMO → ${body.to}]\n${finalText}`,
          "whatsapp",
          body.to,
        );
        return NextResponse.json({
          ok: true,
          deliveredAs: finalText,
          translationProvider,
          delivery: {
            status: "queued",
            provider: "demo",
            note: "Demo mode — add WhatsApp keys in Settings to send for real",
          },
        });
      }

      const result = await sendWhatsAppText(body.to, finalText);
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 502 });
      }

      await appendOutboundNote(
        ghId,
        body.threadId,
        `[WHATSAPP → ${body.to}]\n${finalText}`,
        "whatsapp",
        body.to,
      );

      return NextResponse.json({
        ok: true,
        deliveredAs: finalText,
        translationProvider,
        delivery: {
          status: "sent",
          provider: "meta-cloud",
          messageId: result.messageId,
          note: "Sent via WhatsApp Cloud API",
        },
      });
    }

    // Email
    if (!isEmailConfigured()) {
      await appendOutboundNote(
        ghId,
        body.threadId,
        `[EMAIL DEMO → ${body.to}]\n${finalText}`,
        "email",
        body.to,
      );
      return NextResponse.json({
        ok: true,
        deliveredAs: finalText,
        translationProvider,
        delivery: {
          status: "queued",
          provider: "demo",
          note: "Demo mode — add RESEND_API_KEY in Settings to send for real",
        },
        subject: body.subject,
      });
    }

    const subject =
      body.subject?.trim() ||
      `Re: message from ${session.guesthouseName}`;

    const result = await sendEmail({
      to: body.to,
      subject,
      text: finalText,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }

    await appendOutboundNote(
      ghId,
      body.threadId,
      `[EMAIL → ${body.to}]\nSubject: ${subject}\n${finalText}`,
      "email",
      body.to,
    );

    return NextResponse.json({
      ok: true,
      deliveredAs: finalText,
      translationProvider,
      delivery: {
        status: "sent",
        provider: "resend",
        messageId: result.id,
        note: "Sent via Resend",
      },
      subject,
    });
  } catch {
    return NextResponse.json({ error: "Send failed" }, { status: 500 });
  }
}
