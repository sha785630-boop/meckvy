import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getAdminSession } from "@/lib/admin";
import { billingState } from "@/lib/billing";
import { listSignupLeads } from "@/lib/leads";

export const runtime = "nodejs";

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const db = await getDb();
  const accounts = await db
    .select({
      id: schema.guesthouses.id,
      name: schema.guesthouses.name,
      island: schema.guesthouses.island,
      plan: schema.guesthouses.plan,
      planStatus: schema.guesthouses.planStatus,
      referredBy: schema.guesthouses.referredBy,
      trialEndsAt: schema.guesthouses.trialEndsAt,
      paidUntil: schema.guesthouses.paidUntil,
      createdAt: schema.guesthouses.createdAt,
      ownerEmail: schema.users.email,
    })
    .from(schema.guesthouses)
    .leftJoin(schema.users, eq(schema.users.id, schema.guesthouses.ownerUserId))
    .orderBy(desc(schema.guesthouses.createdAt));
  const accountsWithBilling = accounts.map((a) => ({ ...a, billing: billingState(a) }));

  const reviews = await db
    .select()
    .from(schema.reviews)
    .orderBy(desc(schema.reviews.updatedAt));

  return NextResponse.json({
    leads: await listSignupLeads(),
    accounts: accountsWithBilling,
    reviews,
  });
}
