/** Browser-safe experiment rules shared by server actions, UI and tests. */
export type ExperimentStatus = "planned" | "running" | "completed" | "cancelled";
export type SuccessCriteria = { metric: "cpa" | "roas" | "ctr" | "cvr"; direction: "lower" | "higher"; minLiftPct: number; minConversions: number };
export type ExperimentOutcome = "winner" | "loser" | "inconclusive";

const NEXT: Record<ExperimentStatus, ExperimentStatus[]> = { planned: ["running", "cancelled"], running: ["completed", "cancelled"], completed: [], cancelled: [] };
export function canTransition(from: ExperimentStatus, to: ExperimentStatus) { return NEXT[from].includes(to); }

/** Meta plans need 8-15 distinct concepts in total; Google needs 2-4 per market. */
export function conceptCountRule(platform: "google" | "meta", markets: number) {
  const m = Math.max(1, markets);
  return platform === "meta" ? { min: 8, max: 15 } : { min: Math.min(15, 2 * m), max: Math.min(15, 4 * m) };
}

/** Test budget may not exceed the owner's experiment share of the account's daily budget. */
export function testBudgetAllowed(testDaily: number, accountDaily: number, experimentPercent: number) {
  if (!(testDaily > 0) || !(accountDaily > 0)) return false;
  return testDaily <= accountDaily * (experimentPercent / 100) + 1e-9;
}

/** Judge a finished test against its pre-registered success criteria; small samples stay inconclusive. */
export function judgeExperiment(c: SuccessCriteria, control: { value: number; conversions: number }, variant: { value: number; conversions: number }): ExperimentOutcome {
  if (control.conversions < c.minConversions || variant.conversions < c.minConversions || !(control.value > 0)) return "inconclusive";
  const lift = ((variant.value - control.value) / control.value) * 100;
  const better = c.direction === "lower" ? -lift : lift;
  if (better >= c.minLiftPct) return "winner";
  if (better <= -c.minLiftPct) return "loser";
  return "inconclusive";
}
