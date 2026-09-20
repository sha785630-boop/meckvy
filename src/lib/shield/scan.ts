import {
  analyzeMessageContext,
  analyzeUrl,
  analyzeUrlFull,
  overallRisk,
  riskMessage,
  scoreToRisk,
} from "@/lib/shield/analyze";
import { recordCommunityThreat } from "@/lib/shield/community";
import { extractUrls } from "@/lib/shield/extract-urls";
import type { ShieldScanResult, ShieldUrlResult } from "@/lib/shield/types";

export async function scanText(
  text: string,
  options?: { shareThreats?: boolean },
): Promise<ShieldScanResult> {
  const urls = extractUrls(text);
  const shareThreats = options?.shareThreats !== false;

  if (urls.length === 0) {
    const trimmed = text.trim();
    if (trimmed && /^https?:\/\//i.test(trimmed)) {
      urls.push(trimmed);
    } else if (trimmed && trimmed.includes(".")) {
      urls.push(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    }
  }

  const capped = urls.slice(0, 25);
  const contextFlags = analyzeMessageContext(text);

  // Heuristic scan always works (no database required)
  const results: ShieldUrlResult[] = capped.map((u) => analyzeUrl(u));

  // Best-effort enrichment (community list + Safe Browsing)
  await Promise.all(
    results.map(async (r, i) => {
      try {
        const full = await analyzeUrlFull(capped[i]!);
        results[i] = full;
      } catch {
        /* keep heuristic result */
      }
    }),
  );

  if (contextFlags.length > 0 && results.length > 0) {
    const contextBoost = contextFlags.some((f) => f.severity === "high")
      ? 25
      : 15;
    for (const r of results) {
      for (const f of contextFlags) {
        if (!r.flags.some((x) => x.id === f.id)) r.flags.push(f);
      }
      r.score = Math.min(100, r.score + contextBoost);
      r.risk = scoreToRisk(r.score);
    }
  }

  if (shareThreats) {
    await Promise.all(
      results
        .filter((r) => r.risk !== "safe")
        .map((r) =>
          recordCommunityThreat({
            url: r.normalizedUrl || r.url,
            risk: r.risk,
            source: "auto",
            reason: r.flags[0]?.title,
          }).catch(() => null),
        ),
    );
  }

  const risk = overallRisk(results);
  let message = riskMessage(risk, results.length);
  if (urls.length > capped.length) {
    message += ` (Scanned first ${capped.length} of ${urls.length} links.)`;
  }

  return {
    scannedAt: new Date().toISOString(),
    urls: results,
    overallRisk: risk,
    message,
  };
}

export function formatScanForChat(result: ShieldScanResult): string {
  if (result.urls.length === 0) {
    return "LinkShield: No links found. Send me a URL or paste a message with a link to check.";
  }

  const emoji =
    result.overallRisk === "dangerous"
      ? "🚨"
      : result.overallRisk === "suspicious"
        ? "⚠️"
        : "✅";

  const lines = [
    `${emoji} LinkShield scan (${result.overallRisk.toUpperCase()})`,
    result.message,
    "",
  ];

  for (const u of result.urls) {
    lines.push(`• ${u.domain || u.url}`);
    lines.push(`  Risk: ${u.risk} (score ${u.score}/100)`);
    for (const f of u.flags.slice(0, 3)) {
      lines.push(`  - ${f.title}`);
    }
    if (u.flags.length > 3) {
      lines.push(`  - +${u.flags.length - 3} more flags`);
    }
    lines.push("");
  }

  lines.push("Protect others: report scams at /shield");
  return lines.join("\n").trim();
}
