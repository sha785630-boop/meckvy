import { NextResponse } from "next/server";
import { DEMO_GUESTHOUSE_ID } from "@/db";
import { getAdminSession } from "@/lib/admin";
import { getSession } from "@/lib/auth";
import {
  getReviewForGuesthouse,
  listPublicReviews,
  saveReview,
  setReviewHidden,
} from "@/lib/reviews";

export const runtime = "nodejs";

/** Public list, or the signed-in guesthouse's own review with ?mine=1 */
export async function GET(request: Request) {
  const mine = new URL(request.url).searchParams.get("mine") === "1";
  if (mine) {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({
      review: await getReviewForGuesthouse(session.guesthouseId),
      isDemo: session.guesthouseId === DEMO_GUESTHOUSE_ID,
    });
  }
  return NextResponse.json({ reviews: await listPublicReviews(12) });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.guesthouseId === DEMO_GUESTHOUSE_ID) {
    return NextResponse.json(
      { error: "The demo account can’t post reviews — create your own free account first." },
      { status: 403 },
    );
  }

  const body = (await request.json()) as {
    authorName?: string;
    rating?: number;
    body?: string;
  };
  const authorName = body.authorName?.trim().slice(0, 60);
  const text = body.body?.trim().slice(0, 800);
  const rating = Math.round(Number(body.rating));

  if (!authorName || !text || text.length < 10) {
    return NextResponse.json(
      { error: "Add your name and at least a sentence about Meckvy." },
      { status: 400 },
    );
  }
  if (!(rating >= 1 && rating <= 5)) {
    return NextResponse.json({ error: "Pick 1 to 5 stars." }, { status: 400 });
  }

  await saveReview({
    guesthouseId: session.guesthouseId,
    authorName,
    guesthouseName: session.guesthouseName,
    island: session.island,
    rating,
    body: text,
  });

  return NextResponse.json({ ok: true });
}

/** Admin moderation: hide or show a review */
export async function PATCH(request: Request) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }
  const body = (await request.json()) as { id?: string; hidden?: boolean };
  if (!body.id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  await setReviewHidden(body.id, Boolean(body.hidden));
  return NextResponse.json({ ok: true });
}
