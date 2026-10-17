import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { changeOwnPassword } from "@/lib/passwords";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as {
    current?: unknown;
    next?: unknown;
  } | null;
  if (typeof body?.current !== "string" || typeof body.next !== "string") {
    return NextResponse.json({ error: "Fill in both passwords" }, { status: 400 });
  }

  const result = await changeOwnPassword(session.userId, body.current, body.next);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
