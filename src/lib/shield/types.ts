export type RiskLevel = "safe" | "suspicious" | "dangerous";

export type ShieldFlag = {
  id: string;
  severity: "low" | "medium" | "high";
  title: string;
  detail: string;
};

export type ShieldUrlResult = {
  url: string;
  normalizedUrl: string;
  domain: string;
  risk: RiskLevel;
  score: number;
  flags: ShieldFlag[];
};

export type ShieldScanResult = {
  scannedAt: string;
  urls: ShieldUrlResult[];
  overallRisk: RiskLevel;
  message: string;
};
