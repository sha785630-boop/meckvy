import { desc, eq } from "drizzle-orm";
import { getDb, schema, DEMO_GUESTHOUSE_ID } from "@/db";

export type PublicReview = {
  id: string;
  authorName: string;
  guesthouseName: string;
  island: string;
  rating: number;
  body: string;
  createdAt: string;
};

export async function listPublicReviews(limit = 100): Promise<PublicReview[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.reviews)
    .where(eq(schema.reviews.hidden, 0))
    .orderBy(desc(schema.reviews.updatedAt))
    .limit(limit);

  return rows
    .filter((r) => r.guesthouseId !== DEMO_GUESTHOUSE_ID)
    .map((r) => ({
      id: r.id,
      authorName: r.authorName,
      guesthouseName: r.guesthouseName,
      island: r.island,
      rating: r.rating,
      body: r.body,
      createdAt: r.createdAt,
    }));
}

export async function getReviewForGuesthouse(guesthouseId: string) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.reviews)
    .where(eq(schema.reviews.guesthouseId, guesthouseId))
    .limit(1);
  return rows[0] ?? null;
}

export async function saveReview(input: {
  guesthouseId: string;
  authorName: string;
  guesthouseName: string;
  island: string;
  rating: number;
  body: string;
}) {
  const db = await getDb();
  const now = new Date().toISOString();
  const existing = await getReviewForGuesthouse(input.guesthouseId);

  if (existing) {
    await db
      .update(schema.reviews)
      .set({
        authorName: input.authorName,
        guesthouseName: input.guesthouseName,
        island: input.island,
        rating: input.rating,
        body: input.body,
        updatedAt: now,
      })
      .where(eq(schema.reviews.id, existing.id));
    return;
  }

  await db.insert(schema.reviews).values({
    id: `rev-${Date.now()}`,
    guesthouseId: input.guesthouseId,
    authorName: input.authorName,
    guesthouseName: input.guesthouseName,
    island: input.island,
    rating: input.rating,
    body: input.body,
    hidden: 0,
    createdAt: now,
    updatedAt: now,
  });
}

export async function setReviewHidden(id: string, hidden: boolean) {
  const db = await getDb();
  await db
    .update(schema.reviews)
    .set({ hidden: hidden ? 1 : 0 })
    .where(eq(schema.reviews.id, id));
}
