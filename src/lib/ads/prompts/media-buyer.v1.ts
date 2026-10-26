/** Editable source text lives in system.md and the six playbook section files. */
import systemPrompt from "./system.md?raw";
import { MEDIA_BUYER_SECTIONS, mediaBuyerPlaybook, type PlaybookScope } from "../playbook";

export const MEDIA_BUYER_PROMPT_VERSION = "v3";
/** Compatibility export for non-execution consumers; execution uses selective sections. */
export const MEDIA_BUYER_PLAYBOOK = Object.values(MEDIA_BUYER_SECTIONS).join("\n\n");

export const MEDIA_BUYER_SYSTEM_PROMPT = systemPrompt.trim();

export function buildMediaBuyerPrompt(parts: {
  guidelines?: string;
  businessProfile?: string;
  accountBaseline?: string;
  accountContext?: string;
  includePlaybook?: boolean;
} & PlaybookScope): string {
  return [
    MEDIA_BUYER_SYSTEM_PROMPT,
    parts.guidelines?.trim() ? `## Owner guidelines (highest priority)\n${parts.guidelines.trim()}` : "",
    parts.businessProfile?.trim() ? `## Business profile\n${parts.businessProfile.trim()}` : "",
    parts.accountBaseline?.trim() ? `## Account baseline\n${parts.accountBaseline.trim()}` : "",
    parts.accountContext?.trim() ? `## Ad account context\n${parts.accountContext.trim()}` : "",
    parts.includePlaybook === false ? "" : `## Media Buyer Playbook\n${mediaBuyerPlaybook(parts)}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}
