import { desc } from "drizzle-orm";
import { getDb, schema } from "@/db";

export type PlanId = "starter" | "pro";

export type SignupInput = {
  guesthouseName: string;
  island: string;
  contactName: string;
  email: string;
  phone: string;
  plan: PlanId;
  notes?: string;
};

export async function createSignupLead(input: SignupInput) {
  const db = await getDb();
  const id = `lead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const createdAt = new Date().toISOString();

  await db.insert(schema.signupLeads).values({
    id,
    guesthouseName: input.guesthouseName.trim(),
    island: input.island.trim(),
    contactName: input.contactName.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    plan: input.plan,
    createdAt,
    notes: input.notes?.trim() || null,
  });

  return { id, createdAt };
}

export async function listSignupLeads() {
  const db = await getDb();
  return db
    .select()
    .from(schema.signupLeads)
    .orderBy(desc(schema.signupLeads.createdAt));
}
