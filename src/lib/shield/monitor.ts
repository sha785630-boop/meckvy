import { analyzeUrlFull } from "./analyze";
import { recordCommunityThreat } from "./community";
import { notifyClient, riskNotificationCopy } from "./push";
import { scanText } from "./scan";
import {
  createAlert,
  SHIELD_PLATFORMS,
  type ShieldPlatform,
  upsertConnection,
} from "./store";
import type { RiskLevel, ShieldScanResult } from "./types";

export type MonitorInput = {
  clientId: string;
  platform: ShieldPlatform;
  text: string;
  senderHint?: string;
  notifyOnSafe?: boolean;
};

export type MonitorResult = {
  scanned: ShieldScanResult;
  alertsCreated: string[];
  notificationsSent: number;
  block: boolean;
};

export async function monitorMessage(
  input: MonitorInput,
): Promise<MonitorResult> {
  await upsertConnection(input.clientId, input.platform);

  const scanned = await scanText(input.text);
  const alertsCreated: string[] = [];
  let notificationsSent = 0;

  const platformLabel = SHIELD_PLATFORMS[input.platform] ?? input.platform;

  for (const urlResult of scanned.urls) {
    if (urlResult.risk !== "safe") {
      await recordCommunityThreat({
        url: urlResult.normalizedUrl,
        risk: urlResult.risk,
        source: "extension",
        clientId: input.clientId,
        reason: urlResult.flags[0]?.title,
      });
    }

    const shouldAlert =
      urlResult.risk !== "safe" || input.notifyOnSafe === true;

    if (!shouldAlert) continue;

    const alertId = await createAlert({
      clientId: input.clientId,
      platform: input.platform,
      senderHint: input.senderHint,
      messagePreview: input.text,
      url: urlResult.normalizedUrl,
      risk: urlResult.risk,
      score: urlResult.score,
      flags: urlResult.flags,
    });
    alertsCreated.push(alertId);

    if (urlResult.risk === "safe" && !input.notifyOnSafe) continue;

    const copy = riskNotificationCopy(
      urlResult.risk,
      platformLabel,
      input.senderHint,
    );
    const { sent } = await notifyClient({
      clientId: input.clientId,
      title: copy.title,
      body: copy.body,
      url: `/shield/protect?alert=${alertId}`,
      risk: urlResult.risk,
    });
    notificationsSent += sent;
  }

  return {
    scanned,
    alertsCreated,
    notificationsSent,
    block: scanned.overallRisk === "dangerous",
  };
}

export async function quickScanUrl(url: string) {
  return analyzeUrlFull(url);
}

export function shouldWarnUser(risk: RiskLevel): boolean {
  return risk === "dangerous" || risk === "suspicious";
}
