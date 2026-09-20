import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  createdAt: text("created_at").notNull(),
});

export const guesthouses = sqliteTable("guesthouses", {
  id: text("id").primaryKey(),
  ownerUserId: text("owner_user_id").notNull(),
  name: text("name").notNull(),
  island: text("island").notNull(),
  plan: text("plan").notNull(), // starter | pro | demo
  planStatus: text("plan_status").notNull().default("trialing"), // trialing | active | past_due | canceled
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  whatsappNumber: text("whatsapp_number"),
  createdAt: text("created_at").notNull(),
});

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  guesthouseId: text("guesthouse_id").notNull(),
  channel: text("channel").notNull(),
  guestName: text("guest_name").notNull(),
  guestContact: text("guest_contact").notNull(),
  subject: text("subject"),
  body: text("body").notNull(),
  detectedLanguage: text("detected_language").notNull(),
  translatedPreview: text("translated_preview"),
  status: text("status").notNull(),
  receivedAt: text("received_at").notNull(),
  threadId: text("thread_id").notNull(),
});

export const signupLeads = sqliteTable("signup_leads", {
  id: text("id").primaryKey(),
  guesthouseName: text("guesthouse_name").notNull(),
  island: text("island").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  plan: text("plan").notNull(),
  createdAt: text("created_at").notNull(),
  notes: text("notes"),
});

/** LinkShield — device/browser clients */
export const shieldClients = sqliteTable("shield_clients", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  label: text("label").notNull().default("My device"),
  createdAt: text("created_at").notNull(),
});

/** Connected messaging platforms per client */
export const shieldConnections = sqliteTable("shield_connections", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  platform: text("platform").notNull(),
  status: text("status").notNull().default("active"),
  connectedAt: text("connected_at").notNull(),
});

/** Phishing alerts triggered by auto-monitor */
export const shieldAlerts = sqliteTable("shield_alerts", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  platform: text("platform").notNull(),
  senderHint: text("sender_hint"),
  messagePreview: text("message_preview"),
  url: text("url").notNull(),
  risk: text("risk").notNull(),
  score: text("score").notNull(),
  flagsJson: text("flags_json").notNull(),
  read: text("read").notNull().default("0"),
  createdAt: text("created_at").notNull(),
});

/** Web push subscriptions for instant notifications */
export const shieldPushSubscriptions = sqliteTable("shield_push_subscriptions", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: text("created_at").notNull(),
});

/** Shared community threat intelligence */
export const shieldThreats = sqliteTable("shield_threats", {
  id: text("id").primaryKey(),
  urlHash: text("url_hash").notNull().unique(),
  domain: text("domain").notNull(),
  sampleUrl: text("sample_url").notNull(),
  risk: text("risk").notNull(),
  reportCount: text("report_count").notNull().default("1"),
  source: text("source").notNull(),
  reason: text("reason"),
  firstSeenAt: text("first_seen_at").notNull(),
  lastSeenAt: text("last_seen_at").notNull(),
});

export type UserRow = typeof users.$inferSelect;
export type GuesthouseRow = typeof guesthouses.$inferSelect;
export type MessageRow = typeof messages.$inferSelect;
export type SignupLeadRow = typeof signupLeads.$inferSelect;
export type ShieldClientRow = typeof shieldClients.$inferSelect;
export type ShieldAlertRow = typeof shieldAlerts.$inferSelect;
export type ShieldThreatRow = typeof shieldThreats.$inferSelect;
