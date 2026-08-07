import { NextResponse } from "next/server";
import type { LanguageCode } from "@/lib/types";
import { translateText } from "@/lib/translate";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      text?: string;
      from?: LanguageCode;
      to?: LanguageCode;
    };

    if (!body.text?.trim() || !body.from || !body.to) {
      return NextResponse.json(
        { error: "text, from, and to are required" },
        { status: 400 },
      );
    }

    const result = await translateText(body.text, body.from, body.to);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
