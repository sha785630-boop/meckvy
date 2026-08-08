import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isEmailConfigured } from "@/lib/email";
import { isStripeConfigured, getAppUrl } from "@/lib/stripe";
import { isWhatsAppConfigured } from "@/lib/whatsapp";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const turso = Boolean(process.env.TURSO_DATABASE_URL?.trim());
  const appUrl = getAppUrl();

  const checks = [
    {
      id: "turso",
      label: "Database (Turso)",
      ready: turso,
      action: turso
        ? "Connected"
        : "Add TURSO_DATABASE_URL + TURSO_AUTH_TOKEN in Vercel",
    },
    {
      id: "appUrl",
      label: "App URL",
      ready: Boolean(process.env.NEXT_PUBLIC_APP_URL?.trim()),
      action: process.env.NEXT_PUBLIC_APP_URL?.trim()
        ? appUrl
        : "Add NEXT_PUBLIC_APP_URL=https://meckvy-bqug.vercel.app",
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      ready: isWhatsAppConfigured(),
      action: isWhatsAppConfigured()
        ? "Ready — set Meta webhook to /api/whatsapp/webhook"
        : "Add WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID",
    },
    {
      id: "stripe",
      label: "Stripe payments",
      ready: isStripeConfigured(),
      action: isStripeConfigured()
        ? "Ready — Pricing → Pay with Stripe"
        : "Add STRIPE_SECRET_KEY (sk_test_… or sk_live_…)",
    },
    {
      id: "email",
      label: "Email (Resend)",
      ready: isEmailConfigured(),
      action: isEmailConfigured()
        ? "Ready"
        : "Optional — add RESEND_API_KEY + EMAIL_FROM",
    },
  ];

  const required = checks.filter((c) => c.id !== "email");
  const readyCount = required.filter((c) => c.ready).length;

  return NextResponse.json({
    checks,
    readyCount,
    requiredCount: required.length,
    webhookWhatsApp: `${appUrl}/api/whatsapp/webhook`,
    webhookStripe: `${appUrl}/api/stripe/webhook`,
    guesthouseId: session.guesthouseId,
  });
}
