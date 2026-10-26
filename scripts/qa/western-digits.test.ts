import { describe, expect, it } from "bun:test";
import { toWesternDigits } from "../../src/lib/western-digits";

describe("western digits", () => {
  it("converts Arabic-Indic numbers in replies", () => {
    expect(toWesternDigits("٢٠٠٠ ÷ ٢٥ = ٨٠")).toBe("2000 ÷ 25 = 80");
  });
  it("converts the Arabic thousands separator", () => {
    expect(toWesternDigits("٤٬٢٥٠")).toBe("4,250");
  });
});
