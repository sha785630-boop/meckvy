import type { GuestMessage, LanguageCode } from "./types";

const GRAPH_VERSION = "v21.0";

export type WhatsAppConfig = {
  token: string;
  phoneNumberId: string;
  verifyToken: string;
  appSecret?: string;
};

export function getWhatsAppConfig(): WhatsAppConfig | null {
  const token = process.env.WHATSAPP_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const verifyToken =
    process.env.WHATSAPP_VERIFY_TOKEN?.trim() || "meckvy_verify";

  if (!token || !phoneNumberId) return null;

  return {
    token,
    phoneNumberId,
    verifyToken,
    appSecret: process.env.WHATSAPP_APP_SECRET?.trim() || undefined,
  };
}

export function isWhatsAppConfigured(): boolean {
  return getWhatsAppConfig() !== null;
}

/** Digits only, country code included (e.g. 9607xxxxxxx) */
export function normalizeWhatsAppTo(to: string): string {
  return to.replace(/\D/g, "");
}

export async function sendWhatsAppText(
  to: string,
  body: string,
): Promise<{ ok: true; messageId: string } | { ok: false; error: string }> {
  const config = getWhatsAppConfig();
  if (!config) {
    return { ok: false, error: "WhatsApp is not configured" };
  }

  const recipient = normalizeWhatsAppTo(to);
  if (!recipient) {
    return { ok: false, error: "Invalid WhatsApp number" };
  }

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${config.phoneNumberId}/messages`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipient,
        type: "text",
        text: { preview_url: false, body },
      }),
    });

    const data = (await res.json()) as {
      messages?: { id: string }[];
      error?: { message?: string; error_user_msg?: string };
    };

    if (!res.ok) {
      return {
        ok: false,
        error:
          data.error?.error_user_msg ||
          data.error?.message ||
          `WhatsApp API error (${res.status})`,
      };
    }

    const messageId = data.messages?.[0]?.id;
    if (!messageId) {
      return { ok: false, error: "WhatsApp accepted but returned no message id" };
    }

    return { ok: true, messageId };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "WhatsApp send failed",
    };
  }
}

export type IncomingWhatsApp = {
  from: string;
  name: string;
  text: string;
  messageId: string;
  timestamp: string;
};

type WebhookPayload = {
  object?: string;
  entry?: {
    changes?: {
      value?: {
        contacts?: { profile?: { name?: string }; wa_id?: string }[];
        messages?: {
          from?: string;
          id?: string;
          timestamp?: string;
          type?: string;
          text?: { body?: string };
        }[];
      };
    }[];
  }[];
};

export function parseIncomingWhatsApp(
  payload: WebhookPayload,
): IncomingWhatsApp[] {
  if (payload.object !== "whatsapp_business_account") return [];

  const out: IncomingWhatsApp[] = [];

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value?.messages?.length) continue;

      const nameByWa = new Map(
        (value.contacts ?? []).map((c) => [
          c.wa_id ?? "",
          c.profile?.name ?? "Guest",
        ]),
      );

      for (const msg of value.messages) {
        if (msg.type !== "text" || !msg.text?.body || !msg.from || !msg.id) {
          continue;
        }

        const ts = msg.timestamp
          ? new Date(Number(msg.timestamp) * 1000).toISOString()
          : new Date().toISOString();

        out.push({
          from: msg.from,
          name: nameByWa.get(msg.from) || "WhatsApp guest",
          text: msg.text.body,
          messageId: msg.id,
          timestamp: ts,
        });
      }
    }
  }

  return out;
}

/** Lightweight language hint for inbox preview — not a full detector */
export function guessLanguage(text: string): LanguageCode {
  if (/[\u0600-\u06FF]/.test(text)) return "ar";
  if (/[\u4e00-\u9fff]/.test(text)) return "zh";
  if (/[\u0400-\u04FF]/.test(text)) return "ru";
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  if (/[\u0780-\u07BF]/.test(text)) return "dv";
  if (/[äöüßÄÖÜ]/.test(text) || /\b(und|nicht|bitte|guten)\b/i.test(text))
    return "de";
  if (/[àèéìòù]/i.test(text) || /\b(ciao|grazie|buongiorno)\b/i.test(text))
    return "it";
  if (/[àâçéèêëîïôùûü]/i.test(text) || /\b(bonjour|merci|salut)\b/i.test(text))
    return "fr";
  return "en";
}

export function toGuestMessage(incoming: IncomingWhatsApp): GuestMessage {
  const phone = `+${normalizeWhatsAppTo(incoming.from)}`;
  return {
    id: `wa-${incoming.messageId}`,
    channel: "whatsapp",
    guestName: incoming.name,
    guestContact: phone,
    body: incoming.text,
    detectedLanguage: guessLanguage(incoming.text),
    status: "unread",
    receivedAt: incoming.timestamp,
    threadId: `wa-${normalizeWhatsAppTo(incoming.from)}`,
  };
}
