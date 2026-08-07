import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listMessages, markStatus } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ messages: await listMessages(session.guesthouseId) });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    id?: string;
    status?: "unread" | "read" | "replied" | "automated";
  };

  if (!body.id || !body.status) {
    return NextResponse.json(
      { error: "id and status are required" },
      { status: 400 },
    );
  }

  const updated = await markStatus(session.guesthouseId, body.id, body.status);
  if (!updated) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  return NextResponse.json({ message: updated });
}
