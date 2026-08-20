import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getSession } from "@/lib/auth";
import { normalizeWhatsAppTo } from "@/lib/whatsapp";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.guesthouses)
    .where(eq(schema.guesthouses.id, session.guesthouseId))
    .limit(1);
  const gh = rows[0];
  if (!gh) {
    return NextResponse.json({ error: "Guesthouse not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: gh.id,
    name: gh.name,
    island: gh.island,
    whatsappNumber: gh.whatsappNumber ?? "",
  });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { whatsappNumber?: string };
  const digits = normalizeWhatsAppTo(body.whatsappNumber ?? "");
  if (!digits) {
    return NextResponse.json(
      { error: "Enter a WhatsApp number with country code, e.g. 9607xxxxxxx" },
      { status: 400 },
    );
  }

  const db = await getDb();
  await db
    .update(schema.guesthouses)
    .set({ whatsappNumber: digits })
    .where(eq(schema.guesthouses.id, session.guesthouseId));

  return NextResponse.json({ ok: true, whatsappNumber: digits });
}
