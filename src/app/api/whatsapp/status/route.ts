import { NextResponse } from "next/server";
import { isWhatsAppConfigured, getWhatsAppConfig } from "@/lib/whatsapp";

export async function GET() {
  const configured = isWhatsAppConfigured();
  const config = getWhatsAppConfig();

  return NextResponse.json({
    configured,
    phoneNumberIdSet: Boolean(config?.phoneNumberId),
    verifyToken: config?.verifyToken ?? "meckvy_verify",
    webhookPath: "/api/whatsapp/webhook",
    graphApi: configured ? "ready" : "missing_env",
    hint: configured
      ? "Credentials found. Expose this app with HTTPS (ngrok) and set the Meta webhook callback."
      : "Add WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID to .env.local",
  });
}
