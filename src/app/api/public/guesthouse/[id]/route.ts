import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { upsertInbound } from "@/lib/store";
import { guessLanguage } from "@/lib/whatsapp";
import type { GuestMessage } from "@/lib/types";

export const runtime = "nodejs";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

/** Public guesthouse info for website widget */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.guesthouses)
    .where(eq(schema.guesthouses.id, id))
    .limit(1);
  const gh = rows[0];
  if (!gh) {
    return NextResponse.json(
      { error: "Guesthouse not found" },
      { status: 404, headers: corsHeaders() },
    );
  }

  return NextResponse.json(
    {
      id: gh.id,
      name: gh.name,
      island: gh.island,
    },
    { headers: corsHeaders() },
  );
}

/** Website contact form → Meckvy inbox */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      phone?: string;
      message?: string;
      dates?: string;
    };

    const name = body.name?.trim();
    const message = body.message?.trim();
    const email = body.email?.trim();
    const phone = body.phone?.trim();

    if (!name || !message) {
      return NextResponse.json(
        { error: "Name and message are required" },
        { status: 400, headers: corsHeaders() },
      );
    }

    if (!email && !phone) {
      return NextResponse.json(
        { error: "Email or phone is required" },
        { status: 400, headers: corsHeaders() },
      );
    }

    const db = await getDb();
    const rows = await db
      .select()
      .from(schema.guesthouses)
      .where(eq(schema.guesthouses.id, id))
      .limit(1);
    if (!rows[0]) {
      return NextResponse.json(
        { error: "Guesthouse not found" },
        { status: 404, headers: corsHeaders() },
      );
    }

    const contact = email || phone || "unknown";
    const channel = email ? "email" : "whatsapp";
    const threadKey = email
      ? `em-${email.toLowerCase()}`
      : `wa-${phone!.replace(/\D/g, "")}`;

    const fullBody = [
      message,
      body.dates?.trim() ? `\n\nStay dates: ${body.dates.trim()}` : "",
      phone && email ? `\n\nPhone: ${phone}` : "",
      "\n\n— Sent from website widget",
    ].join("");

    const inbound: GuestMessage = {
      id: `web-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      channel,
      guestName: name,
      guestContact: contact,
      subject: `Website inquiry — ${name}`,
      body: fullBody,
      detectedLanguage: guessLanguage(message),
      status: "unread",
      receivedAt: new Date().toISOString(),
      threadId: threadKey,
    };

    await upsertInbound(id, inbound);

    return NextResponse.json(
      {
        ok: true,
        message: "Thanks — the guesthouse will reply soon.",
      },
      { headers: corsHeaders() },
    );
  } catch {
    return NextResponse.json(
      { error: "Could not send inquiry" },
      { status: 500, headers: corsHeaders() },
    );
  }
}
