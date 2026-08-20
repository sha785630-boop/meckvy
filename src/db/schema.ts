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

export type UserRow = typeof users.$inferSelect;
export type GuesthouseRow = typeof guesthouses.$inferSelect;
export type MessageRow = typeof messages.$inferSelect;
export type SignupLeadRow = typeof signupLeads.$inferSelect;
