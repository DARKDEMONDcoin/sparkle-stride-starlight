import { expect, test } from "bun:test";
import { replyLanguage } from "../../src/lib/reply-language";

test("English employee messages select English", () => {
  expect(replyLanguage("Hello, can you help me plan my business?")).toBe("en");
});
test("Arabic employee messages select Arabic", () => {
  expect(replyLanguage("مرحبا كيف يمكنك مساعدتي؟")).toBe("ar");
});
test("explicit reply language overrides message language", () => {
  expect(replyLanguage("مرحبا، أجب بالإنجليزية")).toBe("en");
  expect(replyLanguage("Please reply in Arabic")).toBe("ar");
});
test("requested content language does not change conversation language", () => {
  expect(replyLanguage("Write an Arabic post for my store")).toBe("en");
});
test("URLs do not override Arabic prose", () => {
  expect(replyLanguage("راجع هذا الموقع https://example.com/longenglishpath")).toBe("ar");
});