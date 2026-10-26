import core from "./playbook/core.md?raw";
import google from "./playbook/google.md?raw";
import meta from "./playbook/meta.md?raw";
import landingPages from "./playbook/landing-pages.md?raw";
import diagnostics from "./playbook/diagnostics.md?raw";
import creative from "./playbook/creative.md?raw";

export type MediaBuyerTask = "baseline" | "analysis" | "tracking" | "structure" | "landing_page" | "campaign_draft" | "creative" | "outcome_review" | "daily_audit" | "conversation";
export type MediaBuyerPlatform = "google" | "meta";
export type PlaybookSection = "core" | "google" | "meta" | "landing-pages" | "diagnostics" | "creative";
export type PlaybookScope = { task?: MediaBuyerTask; platforms?: readonly MediaBuyerPlatform[]; weakConversion?: boolean; pageWork?: boolean; writingAds?: boolean };
export const MEDIA_BUYER_SECTIONS: Record<PlaybookSection, string> = { core, google, meta, "landing-pages": landingPages, diagnostics, creative };
export function mediaBuyerSectionNames(scope: PlaybookScope = {}): PlaybookSection[] {
  const selected: PlaybookSection[] = ["core"];
  for (const platform of ["google", "meta"] as const) if (scope.platforms?.includes(platform)) selected.push(platform);
  if (scope.task === "landing_page" || scope.pageWork || scope.weakConversion) selected.push("landing-pages");
  if (scope.task && ["analysis", "tracking", "structure", "landing_page", "outcome_review", "daily_audit"].includes(scope.task)) selected.push("diagnostics");
  if (scope.task === "creative" || scope.writingAds) selected.push("creative");
  return selected;
}
export function mediaBuyerPlaybook(scope: PlaybookScope = {}) {
  return mediaBuyerSectionNames(scope).map((name) => MEDIA_BUYER_SECTIONS[name]).join("\n\n");
}