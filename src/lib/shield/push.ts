import webpush from "web-push";
import { getPushSubscriptions } from "./store";
import type { RiskLevel } from "./types";

let configured = false;

function ensureVapid() {
  if (configured) return;

  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject =
    process.env.VAPID_SUBJECT?.trim() || "mailto:shield@linkshield.app";

  if (!publicKey || !privateKey) {
    if (process.env.NODE_ENV === "development") {
      const keys = webpush.generateVAPIDKeys();
      webpush.setVapidDetails(subject, keys.publicKey, keys.privateKey);
      process.env.VAPID_PUBLIC_KEY = keys.publicKey;
      process.env.VAPID_PRIVATE_KEY = keys.privateKey;
    } else {
      return false;
    }
  } else {
    webpush.setVapidDetails(subject, publicKey, privateKey);
  }

  configured = true;
  return true;
}

export function getVapidPublicKey(): string | null {
  ensureVapid();
  return process.env.VAPID_PUBLIC_KEY?.trim() ?? null;
}

export async function notifyClient(input: {
  clientId: string;
  title: string;
  body: string;
  url?: string;
  risk: RiskLevel;
}) {
  if (!ensureVapid()) return { sent: 0 };

  const subs = await getPushSubscriptions(input.clientId);
  let sent = 0;

  const payload = JSON.stringify({
    title: input.title,
    body: input.body,
    url: input.url ?? "/shield/protect",
    risk: input.risk,
  });

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        );
        sent++;
      } catch {
        /* expired subscription — ignore */
      }
    }),
  );

  return { sent };
}

export function riskNotificationCopy(
  risk: RiskLevel,
  platform: string,
  senderHint?: string,
) {
  const from = senderHint ? ` from ${senderHint}` : "";
  switch (risk) {
    case "dangerous":
      return {
        title: "🚨 Scam link detected",
        body: `A dangerous link${from} in ${platform}. Do not click it.`,
      };
    case "suspicious":
      return {
        title: "⚠️ Suspicious link",
        body: `A risky link${from} in ${platform}. Check before opening.`,
      };
    default:
      return {
        title: "Link checked",
        body: `New link${from} in ${platform} looks okay.`,
      };
  }
}
