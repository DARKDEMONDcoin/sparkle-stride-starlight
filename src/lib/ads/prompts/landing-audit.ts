import contract from "./landing-audit.md?raw";
import { buildMediaBuyerPrompt } from "./media-buyer.v1";
import { checklistKeys } from "../landing-pages";
import type { MediaBuyerPlatform } from "../playbook";

export function landingAuditPrompt(parts: { platforms: readonly MediaBuyerPlatform[]; guidelines?: string; accountBaseline?: string; businessProfile?: string }) {
  return [buildMediaBuyerPrompt({ ...parts, task: "landing_page" }), "## Audit output contract (read-only; overrides general proposal instructions for this task)", contract.replace("{{checklistKeys}}", checklistKeys.join(","))].join("\n\n");
}