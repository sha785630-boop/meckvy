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
  const widgetReady = Boolean(session.guesthouseId);

  const checks = [
    {
      id: "widget",
      label: "Website widget → Inbox",
      ready: widgetReady,
      action: widgetReady
        ? "Primary channel — paste widget on the guesthouse site, reply in Inbox"
        : "Sign in to a guesthouse account",
    },
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
      id: "email",
      label: "Email replies (Resend)",
      ready: isEmailConfigured(),
      action: isEmailConfigured()
        ? "Optional — ready for email replies to website guests"
        : "Optional — add RESEND_API_KEY + EMAIL_FROM to email guests back",
    },
    {
      id: "whatsapp",
      label: "WhatsApp (optional later)",
      ready: isWhatsAppConfigured(),
      action: isWhatsAppConfigured()
        ? "Ready — set Meta webhook to /api/whatsapp/webhook"
        : "Optional — skip until Meta developer signup works",
    },
    {
      id: "stripe",
      label: "Stripe payments",
      ready: isStripeConfigured(),
      action: isStripeConfigured()
        ? "Ready — Pricing → Pay with Stripe"
        : "Optional — add STRIPE_SECRET_KEY when charging customers",
    },
  ];

  const requiredIds = new Set(["widget", "turso", "appUrl"]);
  const required = checks.filter((c) => requiredIds.has(c.id));
  const readyCount = required.filter((c) => c.ready).length;

  return NextResponse.json({
    checks,
    readyCount,
    requiredCount: required.length,
    webhookWhatsApp: `${appUrl}/api/whatsapp/webhook`,
    webhookStripe: `${appUrl}/api/stripe/webhook`,
    widgetPath: `/widget/${session.guesthouseId}`,
    guesthouseId: session.guesthouseId,
  });
}
