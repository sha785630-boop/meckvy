import { eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import {
  parseProfile,
  sanitizeProfile,
  type GuesthouseProfile,
} from "@/lib/profile";

export type PublicGuesthouse = {
  id: string;
  name: string;
  island: string;
  profile: GuesthouseProfile;
  pageViews: number;
};

export async function getPublicGuesthouse(
  id: string,
): Promise<PublicGuesthouse | null> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.guesthouses)
    .where(eq(schema.guesthouses.id, id))
    .limit(1);
  const gh = rows[0];
  if (!gh) return null;
  return {
    id: gh.id,
    name: gh.name,
    island: gh.island,
    profile: parseProfile(gh.profileJson, gh.island),
    pageViews: gh.pageViews ?? 0,
  };
}

export async function countPageView(id: string): Promise<void> {
  try {
    const db = await getDb();
    await db
      .update(schema.guesthouses)
      .set({ pageViews: sql`${schema.guesthouses.pageViews} + 1` })
      .where(eq(schema.guesthouses.id, id));
  } catch {
    // a missed view count must never break the guest page
  }
}

export async function saveProfile(
  id: string,
  input: unknown,
  island: string,
): Promise<GuesthouseProfile> {
  const profile = sanitizeProfile(input, island);
  const db = await getDb();
  await db
    .update(schema.guesthouses)
    .set({ profileJson: JSON.stringify(profile) })
    .where(eq(schema.guesthouses.id, id));
  return profile;
}
