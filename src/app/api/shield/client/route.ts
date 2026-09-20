import { getOrCreateClient, newClientId } from "@/lib/shield/store";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let body: { clientId?: string; label?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const clientId = body.clientId?.trim() || newClientId();
  const client = await getOrCreateClient(clientId, body.label);

  return NextResponse.json({ clientId: client.id, label: client.label });
}
