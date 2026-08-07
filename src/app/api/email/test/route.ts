import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { appendOutboundNote } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      to?: string;
      subject?: string;
      text?: string;
    };

    const to = body.to?.trim();
    const text =
      body.text?.trim() ||
      "Assalamu alaikum — Meckvy email is connected to your guesthouse.";
    const subject =
      body.subject?.trim() || `${session.guesthouseName} — Meckvy test`;

    if (!to) {
      return NextResponse.json(
        { error: "to (guest email) is required" },
        { status: 400 },
      );
    }

    const result = await sendEmail({ to, subject, text });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }

    await appendOutboundNote(
      session.guesthouseId,
      `em-${to.toLowerCase()}`,
      `[EMAIL TEST → ${to}]\nSubject: ${subject}\n${text}`,
      "email",
      to,
    );

    return NextResponse.json({
      ok: true,
      id: result.id,
      note: "Sent via Resend",
    });
  } catch {
    return NextResponse.json({ error: "Test send failed" }, { status: 500 });
  }
}
