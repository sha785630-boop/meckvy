import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { resetOwnerPassword } from "@/lib/passwords";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as {
    action?: string;
    guesthouseId?: string;
  } | null;
  if (body?.action !== "reset-password" || typeof body.guesthouseId !== "string") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const result = await resetOwnerPassword(body.guesthouseId);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, ...result });
}
