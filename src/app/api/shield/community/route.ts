import { NextResponse } from "next/server";
import {
  communityStats,
  getCommunityBlocklist,
  listCommunityThreats,
  reportScam,
} from "@/lib/shield/community";

function withCors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return res;
}

/** Live community threat feed + blocklist for extensions */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") ?? "feed";

  if (mode === "blocklist") {
    const blocklist = await getCommunityBlocklist();
    return withCors(NextResponse.json(blocklist));
  }

  if (mode === "stats") {
    const stats = await communityStats();
    return withCors(NextResponse.json(stats));
  }

  const [threats, stats] = await Promise.all([
    listCommunityThreats(30),
    communityStats(),
  ]);

  return withCors(
    NextResponse.json({
      stats,
      threats: threats.map((t) => ({
        id: t.id,
        domain: t.domain,
        risk: t.risk,
        reportCount: Number(t.reportCount),
        reason: t.reason,
        lastSeenAt: t.lastSeenAt,
        source: t.source,
      })),
    }),
  );
}

/** Community members report a scam link — protects everyone */
export async function POST(request: Request) {
  let body: { url?: string; clientId?: string; note?: string };
  try {
    body = await request.json();
  } catch {
    return withCors(
      NextResponse.json({ error: "Invalid JSON" }, { status: 400 }),
    );
  }

  const url = body.url?.trim();
  if (!url || url.length > 2000) {
    return withCors(
      NextResponse.json({ error: "Valid url required" }, { status: 400 }),
    );
  }

  const id = await reportScam({
    url,
    clientId: body.clientId,
    note: body.note?.slice(0, 200),
  });

  return withCors(
    NextResponse.json({
      ok: true,
      threatId: id,
      message: "Thanks — this scam is now shared with the community.",
    }),
  );
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}
