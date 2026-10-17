import { randomInt } from "node:crypto";
import { eq } from "drizzle-orm";
import { DEMO_USER_ID, getDb, schema } from "@/db";
import { hashPassword, verifyPassword } from "@/lib/auth";

export const MIN_PASSWORD_LENGTH = 6;

/** No 0/O/1/l/I so it's easy to read out or type from a WhatsApp message. */
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function temporaryPassword(length = 10) {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return `${out.slice(0, 5)}-${out.slice(5)}`;
}

/** Sets a new temporary password for the owner of a guesthouse. */
export async function resetOwnerPassword(guesthouseId: string) {
  const db = await getDb();
  const [row] = await db
    .select({ userId: schema.users.id, email: schema.users.email, name: schema.users.name })
    .from(schema.guesthouses)
    .innerJoin(schema.users, eq(schema.users.id, schema.guesthouses.ownerUserId))
    .where(eq(schema.guesthouses.id, guesthouseId))
    .limit(1);
  if (!row) return { error: "Account not found" as const };
  if (row.userId === DEMO_USER_ID) return { error: "The public demo password can’t be changed" as const };

  const password = temporaryPassword();
  await db
    .update(schema.users)
    .set({ passwordHash: hashPassword(password) })
    .where(eq(schema.users.id, row.userId));
  return { email: row.email, name: row.name, password };
}

export async function changeOwnPassword(userId: string, current: string, next: string) {
  if (userId === DEMO_USER_ID) return { error: "The demo password can’t be changed" };
  if (next.length < MIN_PASSWORD_LENGTH) {
    return { error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters` };
  }
  const db = await getDb();
  const [user] = await db
    .select({ passwordHash: schema.users.passwordHash })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);
  if (!user || !verifyPassword(current, user.passwordHash)) {
    return { error: "Your current password is wrong" };
  }
  await db
    .update(schema.users)
    .set({ passwordHash: hashPassword(next) })
    .where(eq(schema.users.id, userId));
  return { ok: true as const };
}
