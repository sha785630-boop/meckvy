import { scanText } from "@/lib/shield/scan";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { text?: string; url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = (body.text ?? body.url ?? "").trim();
  if (!text) {
    return NextResponse.json(
      { error: "Provide `text` or `url` to scan" },
      { status: 400 },
    );
  }

  try {
    const result = await scanText(text);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[shield/scan]", err);
    return NextResponse.json(
      {
        error: "Scan failed",
        detail: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
