/**
 * طبقة ربط محايدة للمنصات الإعلانية: كل منصة وكل طريقة ربط (OAuth مباشر أو وسيط خارجي)
 * تنفّذ نفس الواجهة، فلا يتغير عبدالله عند تبديل طريقة الربط.
 */
import type { ProposedChange } from "./guardrails";
import type { ConversionLag, ConversionSetup, HistoricalChange, HistoryPage, LandingPageMetric } from "./history-contracts";

export type AdPlatform = "google" | "meta" | "tiktok" | "linkedin";
export type DateRange = { since: string; until: string };
export type Metrics = Record<string, number>;
export type Entity = { id: string; name: string; status?: string; parentId?: string; metrics?: Metrics };
export type AdAccountInfo = { externalId: string; name: string; currency: string | null; timezone: string | null };

export interface AdPlatformProvider {
  readonly platform: AdPlatform;
  readonly available: boolean;
  listAccounts(): Promise<AdAccountInfo[]>;
  getCampaigns(accountId: string, range: DateRange): Promise<Entity[]>;
  getAdGroupsOrAdSets(campaignId: string): Promise<Entity[]>;
  getAds(adGroupId: string): Promise<Entity[]>;
  getAssetGroups(accountId: string, range: DateRange): Promise<Entity[]>;
  getHistoryPage(accountId: string, range: DateRange, granularity: "daily" | "weekly", cursor: string | null): Promise<HistoryPage>;
  getChangeHistory(accountId: string, range: DateRange): Promise<{ events: HistoricalChange[]; nextCursor: string | null }>;
  getConversionLag(accountId: string, range: DateRange): Promise<ConversionLag>;
  getLandingPageMetrics(accountId: string, range: DateRange): Promise<{ rows: LandingPageMetric[]; nextCursor: string | null }>;
  getConversionSetup(accountId: string): Promise<ConversionSetup>;
  getKeywordsAndSearchTerms?(campaignId: string): Promise<{ keywords: Entity[]; searchTerms: Entity[] }>;
  getPerformanceMetrics(entityId: string, range: DateRange, breakdowns?: string[]): Promise<Metrics>;
  createCampaignDraft(spec: unknown): Promise<{ externalId: string }>;
  updateEntity(entityId: string, change: ProposedChange): Promise<unknown>;
  validateChange(change: ProposedChange): Promise<{ ok: boolean; message?: string }>;
}

export class ComingSoonError extends Error {
  constructor(platform: AdPlatform) {
    super(`${platform === "tiktok" ? "TikTok" : "LinkedIn"} Ads قريباً.`);
  }
}

function comingSoon(platform: "tiktok" | "linkedin"): AdPlatformProvider {
  const fail = async (): Promise<never> => {
    throw new ComingSoonError(platform);
  };
  return {
    platform,
    available: false,
    listAccounts: fail,
    getCampaigns: fail,
    getAdGroupsOrAdSets: fail,
    getAds: fail,
    getAssetGroups: fail,
    getHistoryPage: fail,
    getChangeHistory: fail,
    getConversionLag: fail,
    getLandingPageMetrics: fail,
    getConversionSetup: fail,
    getPerformanceMetrics: fail,
    createCampaignDraft: fail,
    updateEntity: fail,
    validateChange: fail,
  };
}

export const TikTokProvider = () => comingSoon("tiktok");
export const LinkedInProvider = () => comingSoon("linkedin");

export const PLATFORMS: { id: AdPlatform; label: string; available: boolean }[] = [
  { id: "google", label: "Google Ads", available: true },
  { id: "meta", label: "Meta Ads", available: true },
  { id: "tiktok", label: "TikTok Ads", available: false },
  { id: "linkedin", label: "LinkedIn Ads", available: false },
];
