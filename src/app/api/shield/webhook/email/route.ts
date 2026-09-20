import { NextResponse } from "next/server";
import { formatScanForChat, scanText } from "@/lib/shield/scan";

export const runtime = "nodejs";

type ResendInbound = {
  from?: string;
  subject?: string;
  text?: string;
  html?: string;
};

/** Resend inbound email webhook — forward suspicious emails here to scan links */
export async function POST(request: Request) {
  let payload: ResendInbound;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const body = [payload.subject, payload.text, stripHtml(payload.html)]
    .filter(Boolean)
    .join("\n");

  if (!body.trim()) {
    return NextResponse.json({ error: "Empty email body" }, { status: 400 });
  }

  const result = await scanText(body);
  const report = formatScanForChat(result);

  return NextResponse.json({
    ok: true,
    from: payload.from,
    overallRisk: result.overallRisk,
    urlsFound: result.urls.length,
    report,
  });
}

function stripHtml(html?: string): string {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
