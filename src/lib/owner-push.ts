import webpush from "web-push";
import { eq, inArray } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { adminEmails } from "@/lib/admin";
import { ensureVapid } from "@/lib/shield/push";

export async function saveOwnerSubscription(
  guesthouseId: string,
  sub: { endpoint: string; keys: { p256dh: string; auth: string } },
) {
  const db = await getDb();
  await db
    .delete(schema.ownerPushSubscriptions)
    .where(eq(schema.ownerPushSubscriptions.endpoint, sub.endpoint));
  await db.insert(schema.ownerPushSubscriptions).values({
    id: `ops-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    guesthouseId,
    endpoint: sub.endpoint,
    p256dh: sub.keys.p256dh,
    auth: sub.keys.auth,
    createdAt: new Date().toISOString(),
  });
}

export async function removeOwnerSubscription(endpoint: string) {
  const db = await getDb();
  await db
    .delete(schema.ownerPushSubscriptions)
    .where(eq(schema.ownerPushSubscriptions.endpoint, endpoint));
}

/** Ping the Meckvy admins' devices (they enable alerts like any owner). Never throws. */
export async function notifyAdmins(input: { title: string; body: string; url?: string }) {
  try {
    const db = await getDb();
    const rows = await db
      .select({ id: schema.guesthouses.id })
      .from(schema.guesthouses)
      .innerJoin(schema.users, eq(schema.users.id, schema.guesthouses.ownerUserId))
      .where(inArray(schema.users.email, adminEmails()));
    await Promise.all(rows.map((r) => notifyOwner(r.id, input)));
  } catch {
    // alerts are best-effort
  }
}

/** Ping every device the guesthouse owner enabled. Never throws. */
export async function notifyOwner(
  guesthouseId: string,
  input: { title: string; body: string; url?: string },
): Promise<number> {
  try {
    if (!ensureVapid()) return 0;
    const db = await getDb();
    const subs = await db
      .select()
      .from(schema.ownerPushSubscriptions)
      .where(eq(schema.ownerPushSubscriptions.guesthouseId, guesthouseId));
    const payload = JSON.stringify({
      app: "meckvy",
      title: input.title,
      body: input.body,
      url: input.url ?? "/dashboard/inbox",
    });
    let sent = 0;
    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
            { TTL: 60 * 60 * 24 },
          );
          sent++;
        } catch (err) {
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) {
            await removeOwnerSubscription(sub.endpoint);
          }
        }
      }),
    );
    return sent;
  } catch {
    return 0;
  }
}
