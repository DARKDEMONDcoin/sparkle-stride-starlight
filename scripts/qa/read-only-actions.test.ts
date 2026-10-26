import { describe, expect, it } from "bun:test";
import { isReadOnlyAction } from "../../src/lib/read-only-actions";

describe("read-only actions skip approval", () => {
  it("reading Gmail runs without approval", () => {
    expect(isReadOnlyAction("eva-gmail-search")).toBe(true);
  });
  it("sending email still needs approval", () => {
    expect(isReadOnlyAction("eva-send-email")).toBe(false);
    expect(isReadOnlyAction("eva-outlook-send")).toBe(false);
    expect(isReadOnlyAction("eva-gmail-reply")).toBe(false);
  });
});
