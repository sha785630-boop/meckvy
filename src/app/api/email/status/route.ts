import { NextResponse } from "next/server";
import { getEmailFrom, isEmailConfigured } from "@/lib/email";

export const runtime = "nodejs";

export async function GET() {
  const configured = isEmailConfigured();
  return NextResponse.json({
    configured,
    from: getEmailFrom(),
    webhookPath: "/api/email/webhook",
    hint: configured
      ? "Resend key found. Verify your domain in Resend, set EMAIL_FROM, then send a test."
      : "Add RESEND_API_KEY and EMAIL_FROM to .env.local",
  });
}
