import { Resend } from "resend";
import type { GuestMessage, LanguageCode } from "./types";
import { guessLanguage } from "./whatsapp";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function getEmailFrom(): string {
  return (
    process.env.EMAIL_FROM?.trim() ||
    "Meckvy Guesthouse <onboarding@resend.dev>"
  );
}

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const resend = getResend();
  if (!resend) {
    return { ok: false, error: "Email is not configured (RESEND_API_KEY)" };
  }

  const to = input.to.trim();
  if (!to.includes("@")) {
    return { ok: false, error: "Invalid email address" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: getEmailFrom(),
      to: [to],
      subject: input.subject || "Message from your guesthouse",
      text: input.text,
      replyTo: input.replyTo,
    });

    if (error) {
      return { ok: false, error: error.message };
    }
    if (!data?.id) {
      return { ok: false, error: "Resend returned no message id" };
    }
    return { ok: true, id: data.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Email send failed",
    };
  }
}

export function normalizeEmail(address: string): string {
  const match = address.match(/<([^>]+)>/);
  const raw = (match?.[1] || address).trim().toLowerCase();
  return raw;
}

export type IncomingEmail = {
  from: string;
  fromName: string;
  subject: string;
  text: string;
  messageId: string;
  receivedAt: string;
};

/** Resend inbound webhook (email.received) + flexible fallbacks */
export function parseIncomingEmail(payload: unknown): IncomingEmail | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;

  // Resend event envelope
  const type = typeof root.type === "string" ? root.type : "";
  const data =
    root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root;

  if (type && type !== "email.received" && !data.from && !data.sender) {
    return null;
  }

  const fromRaw =
    (typeof data.from === "string" && data.from) ||
    (typeof data.sender === "string" && data.sender) ||
    "";
  if (!fromRaw) return null;

  const email = normalizeEmail(fromRaw);
  const nameMatch = fromRaw.match(/^"?([^"<]+)"?\s*</);
  const fromName = nameMatch?.[1]?.trim() || email.split("@")[0] || "Guest";

  const subject =
    (typeof data.subject === "string" && data.subject) || "(no subject)";

  const text =
    (typeof data.text === "string" && data.text) ||
    (typeof data.html === "string" &&
      data.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()) ||
    (typeof data.body === "string" && data.body) ||
    "";

  const messageId =
    (typeof data.email_id === "string" && data.email_id) ||
    (typeof data.message_id === "string" && data.message_id) ||
    (typeof data.id === "string" && data.id) ||
    `email-${Date.now()}`;

  const receivedAt =
    (typeof data.created_at === "string" && data.created_at) ||
    new Date().toISOString();

  return {
    from: email,
    fromName,
    subject,
    text: text || subject,
    messageId,
    receivedAt,
  };
}

export async function fetchReceivingEmailBody(
  emailId: string,
): Promise<string | null> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;

  try {
    const res = await fetch(
      `https://api.resend.com/emails/receiving/${emailId}`,
      {
        headers: { Authorization: `Bearer ${key}` },
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      text?: string | null;
      html?: string | null;
    };
    if (data.text?.trim()) return data.text;
    if (data.html?.trim()) {
      return data.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    }
    return null;
  } catch {
    return null;
  }
}

export function toEmailGuestMessage(incoming: IncomingEmail): GuestMessage {
  const lang: LanguageCode = guessLanguage(incoming.text);
  return {
    id: `em-${incoming.messageId}`,
    channel: "email",
    guestName: incoming.fromName,
    guestContact: incoming.from,
    subject: incoming.subject,
    body: incoming.text,
    detectedLanguage: lang,
    status: "unread",
    receivedAt: incoming.receivedAt,
    threadId: `em-${normalizeEmail(incoming.from)}`,
  };
}
