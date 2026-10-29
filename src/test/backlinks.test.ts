import { describe, expect, it } from "vitest";
import { BACKLINK_DIRECTORIES, listingConfirmsLink } from "@/lib/backlinks/directories";

describe("backlink directories", () => {
  it("has exactly 50 unique directories", () => {
    expect(BACKLINK_DIRECTORIES).toHaveLength(50);
    expect(new Set(BACKLINK_DIRECTORIES.map((d) => d.id)).size).toBe(50);
  });
  it("counts a link live only on the directory host with the site domain", () => {
    expect(listingConfirmsLink("https://saashub.com/acme", "https://saashub.com", "<a href='https://acme.io'>", "https://www.acme.io")).toBe(true);
    expect(listingConfirmsLink("https://evil.com/acme", "https://saashub.com", "acme.io", "acme.io")).toBe(false);
    expect(listingConfirmsLink("https://saashub.com/x", "https://saashub.com", "nothing", "acme.io")).toBe(false);
  });
});
