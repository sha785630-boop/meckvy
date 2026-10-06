import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getPublicGuesthouse } from "@/lib/guesthouse-page";
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
  const gh = await getPublicGuesthouse(id);
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
      rooms: gh.profile.rooms,
      replyTime: gh.profile.replyTime,
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
      checkIn?: string;
      checkOut?: string;
      guests?: string | number;
      room?: string;
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

    if (!email) {
      return NextResponse.json(
        { error: "Please leave an email so the guesthouse can reply" },
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

    const contact = email;
    const threadKey = `web-${email.toLowerCase()}`;

    const checkIn = body.checkIn?.trim().slice(0, 10);
    const checkOut = body.checkOut?.trim().slice(0, 10);
    const nights =
      checkIn && checkOut
        ? Math.round(
            (Date.parse(checkOut) - Date.parse(checkIn)) / 86_400_000,
          )
        : 0;
    const guests = String(body.guests ?? "").trim().slice(0, 3);
    const room = body.room?.trim().slice(0, 60);

    const details = [
      checkIn && checkOut
        ? `Stay: ${checkIn} → ${checkOut}${nights > 0 ? ` (${nights} night${nights === 1 ? "" : "s"})` : ""}`
        : body.dates?.trim()
          ? `Stay dates: ${body.dates.trim()}`
          : "",
      guests ? `Guests: ${guests}` : "",
      room ? `Room: ${room}` : "",
      phone ? `Phone: ${phone}` : "",
    ].filter(Boolean);

    const fullBody = [
      message,
      details.length ? `\n\n${details.join("\n")}` : "",
      "\n\n— Sent from your Meckvy booking page",
    ].join("");

    const inbound: GuestMessage = {
      id: `web-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      channel: "website",
      guestName: name,
      guestContact: contact,
      subject: room
        ? `Booking enquiry — ${room} — ${name}`
        : `Website inquiry — ${name}`,
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
        message: "Thanks — your message is in the guesthouse inbox. They’ll reply soon.",
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
