import {
  ABUSE_HOSTING,
  LEGITIMATE_DOMAINS,
  PHISH_PATH_KEYWORDS,
  PROTECTED_BRANDS,
  SUSPICIOUS_TLDS,
  URGENCY_PHRASES,
  URL_SHORTENERS,
} from "./brands";
import { lookupCommunityThreat } from "./community";
import type { RiskLevel, ShieldFlag, ShieldUrlResult } from "./types";

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0),
  );
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[m][n];
}

function hasHomoglyphs(hostname: string): boolean {
  return /[^\x00-\x7F]/.test(hostname) || hostname.includes("xn--");
}

function getRegisteredDomain(hostname: string): string {
  const parts = hostname.split(".");
  if (parts.length <= 2) return hostname;
  const twoPartTlds = [
    "co.uk",
    "com.au",
    "co.nz",
    "org.uk",
    "com.mv",
    "co.za",
  ];
  const lastTwo = parts.slice(-2).join(".");
  if (twoPartTlds.includes(lastTwo) && parts.length >= 3) {
    return parts.slice(-3).join(".");
  }
  return parts.slice(-2).join(".");
}

function isLegitimateDomain(hostname: string, domain: string): boolean {
  const host = hostname.replace(/^www\./, "");
  if (LEGITIMATE_DOMAINS.has(host) || LEGITIMATE_DOMAINS.has(domain)) return true;
  for (const legit of LEGITIMATE_DOMAINS) {
    if (host.endsWith(`.${legit}`)) return true;
  }
  return false;
}

function findBrandImpersonation(hostname: string, domain: string): string | null {
  if (isLegitimateDomain(hostname, domain)) return null;

  const host = hostname.replace(/^www\./, "");
  const labels = host.split(".");
  const base = labels[0] ?? "";
  if (!base) return null;

  for (const brand of PROTECTED_BRANDS) {
    if (base === brand) {
      // brand.something.xyz but not official
      if (!isLegitimateDomain(hostname, domain)) return brand;
      continue;
    }
    const distance = levenshtein(base, brand);
    if (distance > 0 && distance <= 2 && brand.length >= 4) return brand;
    // paypal-secure, secure-paypal, paypa1login
    if (base.includes(brand) && base !== brand && brand.length >= 4) return brand;
    // brand in subdomain of abuse host: paypal.vercel.app
    if (labels.some((l) => l === brand || (l.includes(brand) && brand.length >= 5))) {
      if (ABUSE_HOSTING.has(domain) || SUSPICIOUS_TLDS.has(labels.at(-1) ?? "")) {
        return brand;
      }
    }
  }
  return null;
}

export function scoreToRisk(score: number): RiskLevel {
  if (score >= 55) return "dangerous";
  if (score >= 22) return "suspicious";
  return "safe";
}

function parseUrl(raw: string): URL | null {
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

/** Analyze surrounding message text for scam pressure tactics */
export function analyzeMessageContext(text: string): ShieldFlag[] {
  const flags: ShieldFlag[] = [];
  let matches = 0;
  for (const re of URGENCY_PHRASES) {
    if (re.test(text)) matches++;
  }
  if (matches >= 1) {
    flags.push({
      id: "urgency-language",
      severity: matches >= 2 ? "high" : "medium",
      title: "Pressure / scare language",
      detail:
        "The message uses urgency or fear tactics common in phishing (verify now, account locked, click here).",
    });
  }
  if (/(password|otp|pin|cvv|card\s*number|seed\s*phrase|private\s*key)/i.test(text)) {
    flags.push({
      id: "credential-ask",
      severity: "high",
      title: "Asks for secrets",
      detail:
        "The message asks for passwords, OTP, card details, or wallet keys — never share these via a link.",
    });
  }
  return flags;
}

export function analyzeUrl(raw: string): ShieldUrlResult {
  const flags: ShieldFlag[] = [];
  let score = 0;

  const lower = raw.trim().toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:")) {
    return {
      url: raw,
      normalizedUrl: raw,
      domain: "",
      risk: "dangerous",
      score: 100,
      flags: [
        {
          id: "dangerous-scheme",
          severity: "high",
          title: "Dangerous link type",
          detail: "This link can run code or hide content. Do not open it.",
        },
      ],
    };
  }

  const parsed = parseUrl(raw);
  if (!parsed) {
    return {
      url: raw,
      normalizedUrl: raw,
      domain: "",
      risk: "dangerous",
      score: 100,
      flags: [
        {
          id: "invalid-url",
          severity: "high",
          title: "Invalid URL",
          detail: "This link could not be parsed — it may be malformed on purpose.",
        },
      ],
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  const domain = getRegisteredDomain(hostname);
  const pathAndQuery = `${parsed.pathname}${parsed.search}`.toLowerCase();

  if (parsed.protocol === "http:") {
    score += 18;
    flags.push({
      id: "no-https",
      severity: "medium",
      title: "Not using HTTPS",
      detail: "Legitimate login pages almost always use secure HTTPS connections.",
    });
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    score += 45;
    flags.push({
      id: "ip-host",
      severity: "high",
      title: "IP address instead of domain",
      detail: "Scammers often use raw IP addresses to hide the real site name.",
    });
  }

  if (
    parsed.username ||
    parsed.password ||
    /https?:\/\/[^/]*@/.test(raw)
  ) {
    score += 55;
    flags.push({
      id: "embedded-credentials",
      severity: "high",
      title: "Hidden credentials in URL",
      detail:
        "The @ symbol can trick you into thinking you're on a trusted site when you're not.",
    });
  }

  if (hasHomoglyphs(hostname)) {
    score += 50;
    flags.push({
      id: "homoglyph",
      severity: "high",
      title: "Look-alike characters detected",
      detail:
        "This domain uses special characters that look like normal letters (e.g. аpple vs apple).",
    });
  }

  const subdomainCount = hostname.split(".").length - 2;
  if (subdomainCount >= 3) {
    score += 22;
    flags.push({
      id: "many-subdomains",
      severity: "medium",
      title: "Unusually long subdomain chain",
      detail: `This URL has ${subdomainCount} subdomains — a common phishing trick.`,
    });
  }

  const tld = hostname.split(".").pop() ?? "";
  if (SUSPICIOUS_TLDS.has(tld)) {
    score += 22;
    flags.push({
      id: "suspicious-tld",
      severity: "medium",
      title: "High-risk domain extension",
      detail: `The .${tld} extension is frequently used in scam sites.`,
    });
  }

  if (URL_SHORTENERS.has(domain) || URL_SHORTENERS.has(hostname)) {
    score += 18;
    flags.push({
      id: "shortener",
      severity: "medium",
      title: "Shortened link",
      detail:
        "Short links hide the real destination. Only open if you trust the sender.",
    });
  }

  if (ABUSE_HOSTING.has(domain) || ABUSE_HOSTING.has(hostname)) {
    score += 28;
    flags.push({
      id: "abuse-hosting",
      severity: "high",
      title: "Free hosting often used for scams",
      detail:
        "Phishing kits are frequently hosted on free sites (GitHub Pages, Vercel, Netlify, etc.).",
    });
  }

  const impersonated = findBrandImpersonation(hostname, domain);
  if (impersonated) {
    score += 55;
    flags.push({
      id: "brand-impersonation",
      severity: "high",
      title: `Possible ${impersonated} impersonation`,
      detail: `This domain looks like it is pretending to be ${impersonated}.`,
    });
  }

  const hyphenCount = (hostname.match(/-/g) ?? []).length;
  if (hyphenCount >= 2) {
    score += impersonated ? 12 : 8;
    flags.push({
      id: "hyphen-brand",
      severity: "medium",
      title: "Hyphen-heavy domain",
      detail: "Scammers often glue brand names to extra words with hyphens.",
    });
  }

  const pathHits = PHISH_PATH_KEYWORDS.filter((k) => pathAndQuery.includes(k));
  if (pathHits.length >= 1) {
    const boost =
      impersonated || ABUSE_HOSTING.has(domain) || SUSPICIOUS_TLDS.has(tld)
        ? 20 + Math.min(pathHits.length, 3) * 5
        : 8;
    score += boost;
    flags.push({
      id: "phish-path",
      severity: boost >= 20 ? "high" : "medium",
      title: "Login / verify page pattern",
      detail: `Path looks like a fake ${pathHits.slice(0, 3).join(", ")} page.`,
    });
  }

  if (hostname.includes("login") || hostname.includes("secure") || hostname.includes("verify")) {
    if (impersonated || SUSPICIOUS_TLDS.has(tld) || ABUSE_HOSTING.has(domain)) {
      score += 18;
      flags.push({
        id: "urgent-keywords",
        severity: "medium",
        title: "Urgency keywords in domain",
        detail: "Words like login, secure, or verify in suspicious domains are a red flag.",
      });
    }
  }

  if (parsed.pathname.includes("@")) {
    score += 35;
    flags.push({
      id: "path-at-symbol",
      severity: "high",
      title: "Misleading @ in path",
      detail: "Some phishing links put @ in the path to confuse where you're really going.",
    });
  }

  // Extremely long URLs often hide redirects
  if (raw.length > 180) {
    score += 10;
    flags.push({
      id: "long-url",
      severity: "low",
      title: "Unusually long URL",
      detail: "Very long links can hide redirects or tracking payloads.",
    });
  }

  // Hex / percent-encoded host tricks
  if (/%[0-9a-f]{2}/i.test(hostname) || hostname.includes("0x")) {
    score += 30;
    flags.push({
      id: "encoded-host",
      severity: "high",
      title: "Encoded hostname",
      detail: "Encoded hostnames are a classic way to disguise phishing sites.",
    });
  }

  const port = parsed.port;
  if (port && port !== "443" && port !== "80") {
    score += 12;
    flags.push({
      id: "unusual-port",
      severity: "low",
      title: "Unusual port number",
      detail: `This link uses port ${port}, which is uncommon for normal websites.`,
    });
  }

  return {
    url: raw,
    normalizedUrl: parsed.href,
    domain,
    risk: scoreToRisk(score),
    score: Math.min(score, 100),
    flags,
  };
}

export function overallRisk(urls: ShieldUrlResult[]): RiskLevel {
  if (urls.some((u) => u.risk === "dangerous")) return "dangerous";
  if (urls.some((u) => u.risk === "suspicious")) return "suspicious";
  return "safe";
}

export function riskMessage(risk: RiskLevel, count: number): string {
  if (count === 0) {
    return "No links found in the text. Paste a URL or message containing a link.";
  }
  switch (risk) {
    case "dangerous":
      return "Do not click these links. They show strong signs of a phishing scam.";
    case "suspicious":
      return "These links look risky. Verify with the sender before opening.";
    default:
      return "No major red flags found — but always stay cautious with unexpected links.";
  }
}

export async function checkSafeBrowsing(
  url: string,
): Promise<ShieldFlag | null> {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY?.trim();
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: { clientId: "linkshield", clientVersion: "2.0" },
          threatInfo: {
            threatTypes: [
              "MALWARE",
              "SOCIAL_ENGINEERING",
              "UNWANTED_SOFTWARE",
            ],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url }],
          },
        }),
      },
    );

    if (!res.ok) return null;
    const data = (await res.json()) as { matches?: unknown[] };
    if (data.matches?.length) {
      return {
        id: "google-safe-browsing",
        severity: "high",
        title: "Known malicious link",
        detail:
          "Google Safe Browsing has flagged this URL as dangerous. Do not open it.",
      };
    }
  } catch {
    /* optional enrichment — ignore failures */
  }
  return null;
}

export async function analyzeUrlFull(raw: string): Promise<ShieldUrlResult> {
  const result = analyzeUrl(raw);

  try {
    const community = await lookupCommunityThreat(result.normalizedUrl || raw);
    if (community) {
      const reports = Number(community.reportCount);
      result.flags.unshift({
        id: "community-threat",
        severity: "high",
        title:
          community.risk === "dangerous"
            ? "Community-confirmed scam"
            : "Reported by the community",
        detail: `${reports} report${reports === 1 ? "" : "s"} in LinkShield. ${community.reason ?? "Others flagged this link as unsafe."}`,
      });
      result.score = Math.min(
        100,
        result.score +
          (community.risk === "dangerous" ? 70 : 40) +
          Math.min(reports, 5) * 3,
      );
      result.risk = scoreToRisk(result.score);
    }
  } catch {
    /* community DB optional */
  }

  try {
    const sbFlag = await checkSafeBrowsing(result.normalizedUrl);
    if (sbFlag) {
      result.flags.unshift(sbFlag);
      result.score = Math.min(100, result.score + 60);
      result.risk = scoreToRisk(result.score);
    }
  } catch {
    /* Safe Browsing optional */
  }
  return result;
}
