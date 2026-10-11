import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { isAdminEmail } from "@/lib/admin";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;

  const db = await getDb();
  const [slip] = await db
    .select({
      guesthouseId: schema.payments.guesthouseId,
      mime: schema.payments.slipMime,
      data: schema.payments.slipData,
    })
    .from(schema.payments)
    .where(eq(schema.payments.id, id))
    .limit(1);
  if (!slip || (slip.guesthouseId !== session.guesthouseId && !isAdminEmail(session.email))) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(Buffer.from(slip.data, "base64"), {
    headers: { "Content-Type": slip.mime, "Cache-Control": "private, max-age=3600" },
  });
}
