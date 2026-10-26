export const ADS_DEFAULTS = {
  googleVersion: "v26",
  metaVersion: "v26.0",
  provider: "pipeboard",
  sunsetWarningDays: 90,
  baselineFreshnessDays: 7,
  newAccountMinDays: 30,
  newAccountMinConversions: 30,
  dailyAudit: false,
} as const;

export function validApiVersion(platform: "google" | "meta", version: string): boolean {
  return platform === "google" ? /^v\d+$/.test(version) : /^v\d+\.\d+$/.test(version);
}

export function apiLifecycleHealth(input: {
  configured: string;
  registered: string;
  sunsetAt: string | null;
  sunsetMonth: string | null;
  precision: string;
}, now = new Date()) {
  if (input.configured !== input.registered) return { status: "unverified", daysRemaining: null } as const;
  const deadline = input.precision === "exact" ? input.sunsetAt
    : input.precision === "tentative_month" && input.sunsetMonth ? `${input.sunsetMonth}-01` : null;
  if (!deadline) return { status: "unknown", daysRemaining: null } as const;
  const daysRemaining = Math.ceil((new Date(`${deadline.slice(0, 10)}T00:00:00Z`).getTime() - now.getTime()) / 86_400_000);
  if (!Number.isFinite(daysRemaining)) return { status: "unknown", daysRemaining: null } as const;
  return { status: daysRemaining < 0 ? "sunset" : daysRemaining <= ADS_DEFAULTS.sunsetWarningDays ? "warning" : "current", daysRemaining } as const;
}