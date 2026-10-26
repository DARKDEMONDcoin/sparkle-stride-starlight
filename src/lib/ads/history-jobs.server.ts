import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { historyWindows } from "./history";
import { z } from "zod";

export const HISTORY_WORK_BUDGET_MS = 20_000;
export const HISTORY_BATCH_SIZE = 3;
const cursorSchema = z.object({ window: z.number().int().nonnegative().default(0), page: z.string().nullable().default(null) });
type Scope = { jobId: string; workspaceId: string; accountId: string; accountToday: string };
type Unit = { nextCursor: string | null };
export type HistoryJobDependencies = {
  claim: () => Promise<{ leaseToken: string; cursor: unknown } | null>;
  checkpoint: (token: string, cursor: { window: number; page: string | null }, progress: { completed: number; total: number }, status: "queued" | "paused" | "completed" | "failed", reason: string | null) => Promise<boolean>;
  process: (window: ReturnType<typeof historyWindows>[number], page: string | null) => Promise<Unit>;
  now: () => number;
  available: boolean;
};

/** Processing must durably upsert each page before returning; never mark fetched-only work complete. */
export async function runHistoryChunk(accountToday: string, deps: HistoryJobDependencies) {
  const started = deps.now();
  const claimed = await deps.claim();
  if (!claimed) return { status: "not_claimed" as const, processed: 0 };
  const windows = historyWindows(accountToday);
  const parsed = cursorSchema.safeParse(claimed.cursor);
  if (!parsed.success || parsed.data.window > windows.length) {
    await deps.checkpoint(claimed.leaseToken, { window: 0, page: null }, { completed: 0, total: windows.length }, "failed", "invalid_cursor");
    return { status: "failed" as const, processed: 0 };
  }
  const cursor = parsed.data;
  const progress = () => ({ completed: cursor.window, total: windows.length });
  if (!deps.available) {
    const saved = await deps.checkpoint(claimed.leaseToken, cursor, progress(), "paused", "provider_on_hold");
    return { status: saved ? "paused" as const : "lease_lost" as const, processed: 0 };
  }
  let processed = 0;
  try {
    while (processed < HISTORY_BATCH_SIZE && deps.now() - started < HISTORY_WORK_BUDGET_MS) {
      const window = windows[cursor.window];
      if (!window) break;
      const unit = await deps.process(window, cursor.page);
      cursor.page = unit.nextCursor;
      if (unit.nextCursor === null) cursor.window += 1;
      processed += 1;
    }
    const status = cursor.window === windows.length ? "completed" : "queued";
    const saved = await deps.checkpoint(claimed.leaseToken, cursor, progress(), status, null);
    return { status: saved ? status : "lease_lost" as const, processed };
  } catch {
    // Terminal until explicit owner recovery. Never put raw upstream errors/tokens into progress.
    const saved = await deps.checkpoint(claimed.leaseToken, cursor, progress(), "paused", "history_processing_failed");
    return { status: saved ? "paused" as const : "lease_lost" as const, processed };
  }
}

/** Internal server entry point only. No scheduler, enqueue endpoint, or operational adapter is activated. */
export async function runHeldHistoryJob(client: SupabaseClient<Database>, scope: Scope) {
  return runHistoryChunk(scope.accountToday, {
    available: false, now: Date.now,
    claim: async () => {
      const { data, error } = await client.rpc("ads_claim_job", { p_job_id: scope.jobId, p_workspace_id: scope.workspaceId, p_account_id: scope.accountId });
      if (error) throw new Error("Unable to claim history job");
      const job = data?.[0];
      return job?.lease_token ? { leaseToken: job.lease_token, cursor: job.cursor } : null;
    },
    checkpoint: async (token, cursor, progress, status, reason) => {
      const { data, error } = await client.rpc("ads_checkpoint_job", { p_job_id: scope.jobId, p_lease_token: token, p_cursor: cursor, p_progress: progress, p_status: status, ...(reason ? { p_pause_reason: reason } : {}) });
      if (error) throw new Error("Unable to checkpoint history job");
      return data === true;
    },
    process: async () => { throw new Error("Provider on hold"); },
  });
}