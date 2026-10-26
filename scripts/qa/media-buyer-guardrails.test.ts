import { describe, expect, it } from "vitest";
import { allowedInBatch, checkGuardrails, requireApproval } from "../../src/lib/ads/guardrails";
import { buildMediaBuyerPrompt } from "../../src/lib/ads/prompts/media-buyer.v1";

describe("Media Buyer guardrails", () => {
  it("rejects a budget increase above 20%", () => {
    expect(checkGuardrails({ kind: "budget", entityId: "c", currentDaily: 100, newDaily: 121 }).ok).toBe(false);
  });
  it("allows exactly 20%", () => {
    expect(checkGuardrails({ kind: "budget", entityId: "c", currentDaily: 100, newDaily: 120 }).ok).toBe(true);
  });
  it("rejects a budget that would exceed the monthly cap", () => {
    const r = checkGuardrails(
      { kind: "budget", entityId: "c", currentDaily: 100, newDaily: 110 },
      { maxBudgetIncreasePct: 20, monthlyCap: 3000, daysInMonth: 30 },
    );
    expect(r.ok).toBe(false);
  });
  it("refuses execution without an approved record", () => {
    expect(requireApproval(null, "w1").ok).toBe(false);
    expect(requireApproval({ status: "pending", workspaceId: "w1", decidedBy: "u" }, "w1").ok).toBe(false);
    expect(requireApproval({ status: "approved", workspaceId: "w2", decidedBy: "u" }, "w1").ok).toBe(false);
    expect(requireApproval({ status: "approved", workspaceId: "w1", decidedBy: "u" }, "w1").ok).toBe(true);
  });
  it("keeps budget increases and enabling a whole campaign out of batch approval", () => {
    expect(allowedInBatch({ kind: "budget", entityId: "c", currentDaily: 100, newDaily: 110 })).toBe(false);
    expect(allowedInBatch({ kind: "status", entityId: "c", level: "campaign", to: "ENABLED" })).toBe(false);
    expect(allowedInBatch({ kind: "negative_keyword", entityId: "c", keyword: "free" })).toBe(true);
  });
  it("injects owner guidelines into the prompt", () => {
    expect(buildMediaBuyerPrompt({ guidelines: "Never say guaranteed" })).toContain("Never say guaranteed");
  });
});
