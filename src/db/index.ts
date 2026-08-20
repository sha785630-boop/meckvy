import fs from "node:fs";
import path from "node:path";
import { createClient, type Client } from "@libsql/client";
import bcrypt from "bcryptjs";
import { count, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { DEMO_MESSAGES } from "@/lib/data";
import * as schema from "./schema";

const DATA_DIR = path.join(process.cwd(), "data");

export const DEMO_GUESTHOUSE_ID = "gh-demo";
export const DEMO_USER_ID = "user-demo";

type AppDb = ReturnType<typeof drizzle<typeof schema>>;

let dbInstance: AppDb | null = null;
let initPromise: Promise<AppDb> | null = null;

function createLibsqlClient(): Client {
  const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();
  const tursoToken = process.env.TURSO_AUTH_TOKEN?.trim();

  if (tursoUrl) {
    return createClient({
      url: tursoUrl,
      authToken: tursoToken,
    });
  }

  fs.mkdirSync(DATA_DIR, { recursive: true });
  const filePath = path.join(DATA_DIR, "meckvy.db");
  return createClient({ url: `file:${filePath}` });
}

async function ensureSchema(client: Client) {
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS guesthouses (
      id TEXT PRIMARY KEY NOT NULL,
      owner_user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      island TEXT NOT NULL,
      plan TEXT NOT NULL,
      plan_status TEXT NOT NULL DEFAULT 'trialing',
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY NOT NULL,
      guesthouse_id TEXT NOT NULL DEFAULT '${DEMO_GUESTHOUSE_ID}',
      channel TEXT NOT NULL,
      guest_name TEXT NOT NULL,
      guest_contact TEXT NOT NULL,
      subject TEXT,
      body TEXT NOT NULL,
      detected_language TEXT NOT NULL,
      translated_preview TEXT,
      status TEXT NOT NULL,
      received_at TEXT NOT NULL,
      thread_id TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS signup_leads (
      id TEXT PRIMARY KEY NOT NULL,
      guesthouse_name TEXT NOT NULL,
      island TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      plan TEXT NOT NULL,
      created_at TEXT NOT NULL,
      notes TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_messages_received_at ON messages(received_at);
    CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id);
    CREATE INDEX IF NOT EXISTS idx_messages_gh ON messages(guesthouse_id);
  `);

  // Best-effort migrations for older local DBs
  const alterStatements = [
    `ALTER TABLE messages ADD COLUMN guesthouse_id TEXT NOT NULL DEFAULT '${DEMO_GUESTHOUSE_ID}'`,
    `ALTER TABLE guesthouses ADD COLUMN plan_status TEXT NOT NULL DEFAULT 'trialing'`,
    `ALTER TABLE guesthouses ADD COLUMN stripe_customer_id TEXT`,
    `ALTER TABLE guesthouses ADD COLUMN stripe_subscription_id TEXT`,
    `ALTER TABLE guesthouses ADD COLUMN whatsapp_number TEXT`,
  ];
  for (const sql of alterStatements) {
    try {
      await client.execute(sql);
    } catch {
      // column already exists
    }
  }
}

async function seedDemoAccount(db: AppDb) {
  const existing = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, "demo@meckvy.mv"))
    .limit(1);

  if (existing.length === 0) {
    const now = new Date().toISOString();
    await db.insert(schema.users).values({
      id: DEMO_USER_ID,
      email: "demo@meckvy.mv",
      passwordHash: bcrypt.hashSync("demo1234", 10),
      name: "Demo Host",
      createdAt: now,
    });

    await db.insert(schema.guesthouses).values({
      id: DEMO_GUESTHOUSE_ID,
      ownerUserId: DEMO_USER_ID,
      name: "Lagoon Pearl Guesthouse",
      island: "Maafushi",
      plan: "demo",
      planStatus: "trialing",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      whatsappNumber: null,
      createdAt: now,
    });
  }

  const [{ value }] = await db
    .select({ value: count() })
    .from(schema.messages)
    .where(eq(schema.messages.guesthouseId, DEMO_GUESTHOUSE_ID));

  if (value > 0) return;

  await db.insert(schema.messages).values(
    DEMO_MESSAGES.map((m) => ({
      id: m.id,
      guesthouseId: DEMO_GUESTHOUSE_ID,
      channel: m.channel,
      guestName: m.guestName,
      guestContact: m.guestContact,
      subject: m.subject ?? null,
      body: m.body,
      detectedLanguage: m.detectedLanguage,
      translatedPreview: m.translatedPreview ?? null,
      status: m.status,
      receivedAt: m.receivedAt,
      threadId: m.threadId,
    })),
  );
}

export async function getDb(): Promise<AppDb> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const client = createLibsqlClient();
    await ensureSchema(client);
    const db = drizzle(client, { schema });
    await seedDemoAccount(db);
    dbInstance = db;
    return db;
  })();

  return initPromise;
}

export { schema };
