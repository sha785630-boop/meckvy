import { NextResponse } from "next/server";
import { count, eq } from "drizzle-orm";
import { DEMO_GUESTHOUSE_ID, getDb, schema } from "@/db";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_PHOTOS = 20;
const MAX_BASE64_LENGTH = 1_400_000;

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.guesthouseId === DEMO_GUESTHOUSE_ID) {
    return NextResponse.json(
      { error: "The demo account can’t upload photos — create your own free account." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    dataUrl?: string;
  } | null;
  const match = body?.dataUrl?.match(/^data:(image\/(?:jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    return NextResponse.json({ error: "Please upload a JPG or WebP photo." }, { status: 400 });
  }
  const [, mime, data] = match;
  if (data.length > MAX_BASE64_LENGTH) {
    return NextResponse.json({ error: "That photo is too large." }, { status: 413 });
  }

  const db = await getDb();
  const [{ value }] = await db
    .select({ value: count() })
    .from(schema.photos)
    .where(eq(schema.photos.guesthouseId, session.guesthouseId));
  if (value >= MAX_PHOTOS) {
    return NextResponse.json(
      { error: `You can keep up to ${MAX_PHOTOS} photos — remove one first.` },
      { status: 400 },
    );
  }

  const id = `ph-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await db.insert(schema.photos).values({
    id,
    guesthouseId: session.guesthouseId,
    mime,
    data,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, url: `/api/photos/${id}` });
}
