import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Ctx) {
  const { id } = await context.params;
  const db = await getDb();
  const rows = await db
    .select({ mime: schema.photos.mime, data: schema.photos.data })
    .from(schema.photos)
    .where(eq(schema.photos.id, id))
    .limit(1);
  const photo = rows[0];
  if (!photo) {
    return new NextResponse("Not found", { status: 404 });
  }
  return new NextResponse(Buffer.from(photo.data, "base64"), {
    headers: {
      "Content-Type": photo.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

export async function DELETE(_request: Request, context: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const db = await getDb();
  await db
    .delete(schema.photos)
    .where(
      and(
        eq(schema.photos.id, id),
        eq(schema.photos.guesthouseId, session.guesthouseId),
      ),
    );
  return NextResponse.json({ ok: true });
}
