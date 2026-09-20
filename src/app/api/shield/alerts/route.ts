import { NextResponse } from "next/server";
import {
  getOrCreateClient,
  listAlerts,
  listConnections,
  markAlertRead,
  newClientId,
} from "@/lib/shield/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId")?.trim();

  if (!clientId) {
    return NextResponse.json({ error: "clientId required" }, { status: 400 });
  }

  await getOrCreateClient(clientId);
  const [alerts, connections] = await Promise.all([
    listAlerts(clientId),
    listConnections(clientId),
  ]);

  return NextResponse.json({
    alerts: alerts.map((a) => ({
      ...a,
      flags: JSON.parse(a.flagsJson),
      read: a.read === "1",
    })),
    connections,
  });
}

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

export async function PATCH(request: Request) {
  let body: { clientId?: string; alertId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const clientId = body.clientId?.trim();
  const alertId = body.alertId?.trim();
  if (!clientId || !alertId) {
    return NextResponse.json(
      { error: "clientId and alertId required" },
      { status: 400 },
    );
  }

  await markAlertRead(alertId, clientId);
  return NextResponse.json({ ok: true });
}
