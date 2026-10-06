import { NextResponse } from "next/server";
import { DEMO_GUESTHOUSE_ID } from "@/db";
import { getSession } from "@/lib/auth";
import { getPublicGuesthouse, saveProfile } from "@/lib/guesthouse-page";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const gh = await getPublicGuesthouse(session.guesthouseId);
  if (!gh) {
    return NextResponse.json({ error: "Guesthouse not found" }, { status: 404 });
  }
  return NextResponse.json({
    id: gh.id,
    name: gh.name,
    island: gh.island,
    profile: gh.profile,
    pageViews: gh.pageViews,
    isDemo: gh.id === DEMO_GUESTHOUSE_ID,
  });
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.guesthouseId === DEMO_GUESTHOUSE_ID) {
    return NextResponse.json(
      {
        error:
          "The demo page can’t be edited — create your own free account to build your page.",
      },
      { status: 403 },
    );
  }
  const body = (await request.json().catch(() => null)) as {
    profile?: unknown;
  } | null;
  const profile = await saveProfile(
    session.guesthouseId,
    body?.profile,
    session.island,
  );
  return NextResponse.json({ ok: true, profile });
}
