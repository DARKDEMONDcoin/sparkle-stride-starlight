import { afterEach, describe, expect, it, vi } from "vitest";
import { callMcpTool, provisionUser, startOAuth } from "@/lib/ads/pipeboard.server";

afterEach(() => vi.unstubAllGlobals());

describe("Unverified Pipeboard transport", () => {
  it.each(["provision", "oauth", "tool"])("blocks %s before any network call even when configuration exists", async (operation) => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const config = { apiKey: "synthetic-test-value" };
    const run = operation === "provision"
      ? () => provisionUser(config, "workspace")
      : operation === "oauth"
        ? () => startOAuth(config, "delegated-user", "google")
        : () => callMcpTool(config, "meta", "delegated-user", "unverified-tool", {});
    await expect(run()).rejects.toThrow("غير مفعّل");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});