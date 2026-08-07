import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { GuestMessage } from "./types";

function rowToMessage(row: typeof schema.messages.$inferSelect): GuestMessage {
  return {
    id: row.id,
    channel: row.channel as GuestMessage["channel"],
    guestName: row.guestName,
    guestContact: row.guestContact,
    subject: row.subject ?? undefined,
    body: row.body,
    detectedLanguage: row.detectedLanguage as GuestMessage["detectedLanguage"],
    translatedPreview: row.translatedPreview ?? undefined,
    status: row.status as GuestMessage["status"],
    receivedAt: row.receivedAt,
    threadId: row.threadId,
  };
}

export async function listMessages(
  guesthouseId: string,
): Promise<GuestMessage[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.messages)
    .where(eq(schema.messages.guesthouseId, guesthouseId))
    .orderBy(desc(schema.messages.receivedAt));
  return rows.map(rowToMessage);
}

export async function getMessage(
  guesthouseId: string,
  id: string,
): Promise<GuestMessage | undefined> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.messages)
    .where(
      and(
        eq(schema.messages.id, id),
        eq(schema.messages.guesthouseId, guesthouseId),
      ),
    )
    .limit(1);
  return rows[0] ? rowToMessage(rows[0]) : undefined;
}

export async function markStatus(
  guesthouseId: string,
  id: string,
  status: GuestMessage["status"],
): Promise<GuestMessage | undefined> {
  const db = await getDb();
  await db
    .update(schema.messages)
    .set({ status })
    .where(
      and(
        eq(schema.messages.id, id),
        eq(schema.messages.guesthouseId, guesthouseId),
      ),
    );
  return getMessage(guesthouseId, id);
}

export async function upsertInbound(
  guesthouseId: string,
  message: GuestMessage,
): Promise<GuestMessage> {
  const existing = await getMessage(guesthouseId, message.id);
  if (existing) return existing;

  const db = await getDb();
  await db.insert(schema.messages).values({
    id: message.id,
    guesthouseId,
    channel: message.channel,
    guestName: message.guestName,
    guestContact: message.guestContact,
    subject: message.subject ?? null,
    body: message.body,
    detectedLanguage: message.detectedLanguage,
    translatedPreview: message.translatedPreview ?? null,
    status: message.status,
    receivedAt: message.receivedAt,
    threadId: message.threadId,
  });

  return message;
}

export async function appendOutboundNote(
  guesthouseId: string,
  threadId: string,
  note: string,
  channel: GuestMessage["channel"],
  guestContact?: string,
): Promise<void> {
  const db = await getDb();
  const relatedRows = await db
    .select()
    .from(schema.messages)
    .where(
      and(
        eq(schema.messages.threadId, threadId),
        eq(schema.messages.guesthouseId, guesthouseId),
      ),
    )
    .orderBy(desc(schema.messages.receivedAt))
    .limit(1);

  const related = relatedRows[0];
  const contact = guestContact ?? related?.guestContact ?? "";
  if (related) {
    await db
      .update(schema.messages)
      .set({ status: "replied" })
      .where(eq(schema.messages.id, related.id));
  }

  await db.insert(schema.messages).values({
    id: `out-${Date.now()}`,
    guesthouseId,
    channel,
    guestName: "You (Meckvy)",
    guestContact: contact,
    subject: related?.subject ? `Re: ${related.subject}` : null,
    body: note,
    detectedLanguage: "en",
    translatedPreview: null,
    status: "replied",
    receivedAt: new Date().toISOString(),
    threadId,
  });
}
