import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { ShieldFlag, RiskLevel } from "./types";

export const SHIELD_PLATFORMS = {
  whatsapp_web: "WhatsApp Web",
  telegram_web: "Telegram Web",
  gmail: "Gmail",
  messenger: "Facebook Messenger",
  instagram: "Instagram DMs",
  sms_android: "SMS (Android)",
  email_imap: "Email inbox",
} as const;

export type ShieldPlatform = keyof typeof SHIELD_PLATFORMS;

export async function getOrCreateClient(clientId: string, label?: string) {
  const db = await getDb();
  const existing = await db
    .select()
    .from(schema.shieldClients)
    .where(eq(schema.shieldClients.id, clientId))
    .limit(1);

  if (existing[0]) return existing[0];

  const now = new Date().toISOString();
  await db.insert(schema.shieldClients).values({
    id: clientId,
    userId: null,
    label: label ?? "My device",
    createdAt: now,
  });

  return {
    id: clientId,
    userId: null,
    label: label ?? "My device",
    createdAt: now,
  };
}

export async function upsertConnection(
  clientId: string,
  platform: ShieldPlatform,
) {
  const db = await getDb();
  const existing = await db
    .select()
    .from(schema.shieldConnections)
    .where(
      and(
        eq(schema.shieldConnections.clientId, clientId),
        eq(schema.shieldConnections.platform, platform),
      ),
    )
    .limit(1);

  const now = new Date().toISOString();
  if (existing[0]) {
    await db
      .update(schema.shieldConnections)
      .set({ status: "active", connectedAt: now })
      .where(eq(schema.shieldConnections.id, existing[0].id));
    return existing[0].id;
  }

  const id = randomUUID();
  await db.insert(schema.shieldConnections).values({
    id,
    clientId,
    platform,
    status: "active",
    connectedAt: now,
  });
  return id;
}

export async function createAlert(input: {
  clientId: string;
  platform: ShieldPlatform;
  senderHint?: string;
  messagePreview?: string;
  url: string;
  risk: RiskLevel;
  score: number;
  flags: ShieldFlag[];
}) {
  const db = await getDb();
  const id = randomUUID();
  const now = new Date().toISOString();

  await db.insert(schema.shieldAlerts).values({
    id,
    clientId: input.clientId,
    platform: input.platform,
    senderHint: input.senderHint ?? null,
    messagePreview: input.messagePreview?.slice(0, 280) ?? null,
    url: input.url,
    risk: input.risk,
    score: String(input.score),
    flagsJson: JSON.stringify(input.flags),
    read: "0",
    createdAt: now,
  });

  return id;
}

export async function listAlerts(clientId: string, limit = 50) {
  const db = await getDb();
  return db
    .select()
    .from(schema.shieldAlerts)
    .where(eq(schema.shieldAlerts.clientId, clientId))
    .orderBy(desc(schema.shieldAlerts.createdAt))
    .limit(limit);
}

export async function listConnections(clientId: string) {
  const db = await getDb();
  return db
    .select()
    .from(schema.shieldConnections)
    .where(eq(schema.shieldConnections.clientId, clientId));
}

export async function markAlertRead(alertId: string, clientId: string) {
  const db = await getDb();
  await db
    .update(schema.shieldAlerts)
    .set({ read: "1" })
    .where(
      and(
        eq(schema.shieldAlerts.id, alertId),
        eq(schema.shieldAlerts.clientId, clientId),
      ),
    );
}

export async function savePushSubscription(
  clientId: string,
  sub: { endpoint: string; keys: { p256dh: string; auth: string } },
) {
  const db = await getDb();
  const existing = await db
    .select()
    .from(schema.shieldPushSubscriptions)
    .where(eq(schema.shieldPushSubscriptions.endpoint, sub.endpoint))
    .limit(1);

  const now = new Date().toISOString();
  if (existing[0]) {
    await db
      .update(schema.shieldPushSubscriptions)
      .set({
        clientId,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
      })
      .where(eq(schema.shieldPushSubscriptions.id, existing[0].id));
    return existing[0].id;
  }

  const id = randomUUID();
  await db.insert(schema.shieldPushSubscriptions).values({
    id,
    clientId,
    endpoint: sub.endpoint,
    p256dh: sub.keys.p256dh,
    auth: sub.keys.auth,
    createdAt: now,
  });
  return id;
}

export async function getPushSubscriptions(clientId: string) {
  const db = await getDb();
  return db
    .select()
    .from(schema.shieldPushSubscriptions)
    .where(eq(schema.shieldPushSubscriptions.clientId, clientId));
}

export function newClientId() {
  return randomUUID();
}
