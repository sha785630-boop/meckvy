import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb, schema, DEMO_GUESTHOUSE_ID } from "@/db";
import { DEMO_MESSAGES } from "@/lib/data";
import {
  SESSION_COOKIE,
  createSessionToken,
  verifySessionToken,
  type SessionPayload,
} from "@/lib/auth-session";

export {
  SESSION_COOKIE,
  createSessionToken,
  verifySessionToken,
  type SessionPayload,
};

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export function hashPassword(password: string) {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compareSync(password, hash);
}

export async function findUserByEmail(email: string) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email.trim().toLowerCase()))
    .limit(1);
  return rows[0];
}

export async function getGuesthouseForUser(userId: string) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.guesthouses)
    .where(eq(schema.guesthouses.ownerUserId, userId))
    .limit(1);
  return rows[0];
}

export async function registerAccount(input: {
  email: string;
  password: string;
  name: string;
  guesthouseName: string;
  island: string;
  plan?: string;
}): Promise<SessionPayload> {
  const email = input.email.trim().toLowerCase();
  if (await findUserByEmail(email)) {
    throw new Error("An account with this email already exists");
  }
  if (input.password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  const db = await getDb();
  const now = new Date().toISOString();
  const userId = `user-${Date.now()}`;
  const guesthouseId = `gh-${Date.now()}`;

  await db.insert(schema.users).values({
    id: userId,
    email,
    passwordHash: hashPassword(input.password),
    name: input.name.trim(),
    createdAt: now,
  });

  await db.insert(schema.guesthouses).values({
    id: guesthouseId,
    ownerUserId: userId,
    name: input.guesthouseName.trim(),
    island: input.island.trim(),
    plan: input.plan ?? "starter",
    planStatus: "trialing",
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    createdAt: now,
  });

  await db.insert(schema.messages).values(
    DEMO_MESSAGES.map((m) => ({
      id: `${guesthouseId}-${m.id}`,
      guesthouseId,
      channel: m.channel,
      guestName: m.guestName,
      guestContact: m.guestContact,
      subject: m.subject ?? null,
      body: m.body,
      detectedLanguage: m.detectedLanguage,
      translatedPreview: m.translatedPreview ?? null,
      status: m.status,
      receivedAt: m.receivedAt,
      threadId: `${guesthouseId}-${m.threadId}`,
    })),
  );

  return {
    userId,
    email,
    name: input.name.trim(),
    guesthouseId,
    guesthouseName: input.guesthouseName.trim(),
    island: input.island.trim(),
    plan: input.plan ?? "starter",
  };
}

export async function loginAccount(
  email: string,
  password: string,
): Promise<SessionPayload> {
  const user = await findUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new Error("Invalid email or password");
  }
  const gh = await getGuesthouseForUser(user.id);
  if (!gh) {
    throw new Error("No guesthouse linked to this account");
  }
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    guesthouseId: gh.id,
    guesthouseName: gh.name,
    island: gh.island,
    plan: gh.plan,
  };
}

export function resolveInboundGuesthouseId(): string {
  return process.env.WHATSAPP_GUESTHOUSE_ID?.trim() || DEMO_GUESTHOUSE_ID;
}
