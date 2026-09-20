import { createHash, randomUUID } from "node:crypto";
import { desc, eq, gte, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { RiskLevel } from "./types";

export function normalizeThreatKey(url: string): { key: string; domain: string } {
  try {
    const u = new URL(url.includes("://") ? url : `https://${url}`);
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    const path = u.pathname.replace(/\/+$/, "") || "/";
    const key = createHash("sha256")
      .update(`${host}${path}`)
      .digest("hex")
      .slice(0, 32);
    return { key, domain: host };
  } catch {
    const key = createHash("sha256").update(url.toLowerCase()).digest("hex").slice(0, 32);
    return { key, domain: url.slice(0, 80) };
  }
}

export async function lookupCommunityThreat(url: string) {
  try {
    const { key } = normalizeThreatKey(url);
    const db = await getDb();
    const rows = await db
      .select()
      .from(schema.shieldThreats)
      .where(eq(schema.shieldThreats.urlHash, key))
      .limit(1);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function recordCommunityThreat(input: {
  url: string;
  risk: RiskLevel;
  source: "auto" | "report" | "extension";
  clientId?: string;
  reason?: string;
}) {
  if (input.risk === "safe") return null;

  try {
    const { key, domain } = normalizeThreatKey(input.url);
    const db = await getDb();
    const existing = await db
      .select()
      .from(schema.shieldThreats)
      .where(eq(schema.shieldThreats.urlHash, key))
      .limit(1);

    const now = new Date().toISOString();

    if (existing[0]) {
      const reports = Number(existing[0].reportCount) + 1;
      const newRisk =
        input.risk === "dangerous" || existing[0].risk === "dangerous"
          ? "dangerous"
          : "suspicious";
      await db
        .update(schema.shieldThreats)
        .set({
          reportCount: String(reports),
          risk: newRisk,
          lastSeenAt: now,
          reason: input.reason ?? existing[0].reason,
        })
        .where(eq(schema.shieldThreats.id, existing[0].id));
      return existing[0].id;
    }

    const id = randomUUID();
    await db.insert(schema.shieldThreats).values({
      id,
      urlHash: key,
      domain,
      sampleUrl: input.url.slice(0, 500),
      risk: input.risk,
      reportCount: "1",
      source: input.source,
      reason: input.reason ?? null,
      firstSeenAt: now,
      lastSeenAt: now,
    });
    return id;
  } catch {
    return null;
  }
}

export async function listCommunityThreats(limit = 40) {
  try {
    const db = await getDb();
    return db
      .select()
      .from(schema.shieldThreats)
      .orderBy(desc(schema.shieldThreats.lastSeenAt))
      .limit(limit);
  } catch {
    return [];
  }
}

export async function communityStats() {
  try {
    const db = await getDb();
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [totalRow] = await db
      .select({ value: sql<number>`count(*)` })
      .from(schema.shieldThreats);

    const [dayRow] = await db
      .select({ value: sql<number>`count(*)` })
      .from(schema.shieldThreats)
      .where(gte(schema.shieldThreats.lastSeenAt, dayAgo));

    const [dangerRow] = await db
      .select({ value: sql<number>`count(*)` })
      .from(schema.shieldThreats)
      .where(eq(schema.shieldThreats.risk, "dangerous"));

    const [alertRow] = await db
      .select({ value: sql<number>`count(*)` })
      .from(schema.shieldAlerts)
      .where(gte(schema.shieldAlerts.createdAt, dayAgo));

    return {
      knownThreats: Number(totalRow?.value ?? 0),
      threatsLast24h: Number(dayRow?.value ?? 0),
      dangerousThreats: Number(dangerRow?.value ?? 0),
      alertsLast24h: Number(alertRow?.value ?? 0),
    };
  } catch {
    return {
      knownThreats: 0,
      threatsLast24h: 0,
      dangerousThreats: 0,
      alertsLast24h: 0,
    };
  }
}

export async function reportScam(input: {
  url: string;
  clientId?: string;
  note?: string;
}) {
  return recordCommunityThreat({
    url: input.url,
    risk: "dangerous",
    source: "report",
    clientId: input.clientId,
    reason: input.note ?? "Community report",
  });
}

/** Export compact blocklist for extensions (domains + hashes) */
export async function getCommunityBlocklist(limit = 500) {
  try {
    const db = await getDb();
    const rows = await db
      .select()
      .from(schema.shieldThreats)
      .where(eq(schema.shieldThreats.risk, "dangerous"))
      .orderBy(desc(schema.shieldThreats.lastSeenAt))
      .limit(limit);

    return {
      updatedAt: new Date().toISOString(),
      domains: [...new Set(rows.map((r) => r.domain))],
      hashes: rows.map((r) => r.urlHash),
    };
  } catch {
    return {
      updatedAt: new Date().toISOString(),
      domains: [] as string[],
      hashes: [] as string[],
    };
  }
}
