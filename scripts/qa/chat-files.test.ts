import { describe, test, expect } from "bun:test";
import JSZip from "jszip";
import { chatFileError, CHAT_FILE_MAX_PER_MESSAGE } from "../../src/lib/chat-files";
import { extractChatFile, relevantExcerpt, buildDocumentContext } from "../../src/lib/chat-files.server";

describe("chat document uploads", () => {
  test("accepts PDF, Word, Excel and CSV up to 20 MB", () => {
    for (const name of ["a.pdf", "عقد.docx", "a.doc", "a.xlsx", "a.xls", "a.csv"]) expect(chatFileError({ name, size: 1000 })).toBeNull();
    expect(chatFileError({ name: "a.pdf", size: 20 * 1024 * 1024 })).toBeNull();
  });
  test("rejects over 20 MB, empty and other types", () => {
    expect(chatFileError({ name: "a.pdf", size: 20 * 1024 * 1024 + 1 })).not.toBeNull();
    expect(chatFileError({ name: "a.pdf", size: 0 })).not.toBeNull();
    expect(chatFileError({ name: "a.png", size: 10 })).not.toBeNull();
    expect(chatFileError({ name: "a.txt", size: 10 })).not.toBeNull();
  });
  test("max 5 files per message", () => expect(CHAT_FILE_MAX_PER_MESSAGE).toBe(5));
  test("Word keeps headings, lists and tables", async () => {
    const zip = new JSZip();
    zip.file("word/document.xml", '<w:document><w:body><w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>عقد خدمات</w:t></w:r></w:p><w:p><w:pPr><w:numPr/></w:pPr><w:r><w:t>البند الأول: الدفع خلال 30 يوماً</w:t></w:r></w:p><w:tbl><w:tr><w:tc><w:p><w:r><w:t>الخدمة</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>السعر</w:t></w:r></w:p></w:tc></w:tr></w:tbl></w:body></w:document>');
    const out = await extractChatFile("عقد.docx", await zip.generateAsync({ type: "uint8array" }));
    expect(out.text).toContain("# عقد خدمات");
    expect(out.text).toContain("- البند الأول");
    expect(out.text).toContain("| الخدمة | السعر |");
  });
  test("Excel large sheet keeps summary and full rows", async () => {
    const { utils, write } = await import("xlsx");
    const book = utils.book_new();
    utils.book_append_sheet(book, utils.aoa_to_sheet([["المنتج", "المبيعات"], ...Array.from({ length: 300 }, (_, i) => [`P${i}`, i])]), "Sales");
    const out = await extractChatFile("s.xlsx", new Uint8Array(write(book, { type: "array", bookType: "xlsx" })));
    expect(out.summary).toContain("300 صف");
    expect(out.text).toContain("P299");
  });
  test("corrupt files report a clear error", async () => {
    await expect(extractChatFile("x.pdf", new TextEncoder().encode("not a pdf at all"))).rejects.toThrow("PDF");
    await expect(extractChatFile("x.docx", new TextEncoder().encode("garbage"))).rejects.toThrow("تالف");
  });
  test("long documents return relevant chunks within budget", () => {
    const text = "مقدمة ".repeat(800) + "\n" + "بند الغرامة المالية 5000 ريال\n" + "حشو ".repeat(5000);
    const ex = relevantExcerpt(text, "ما هي الغرامة المالية؟", 9000);
    expect(ex.length).toBeLessThan(10_500);
    expect(ex).toContain("الغرامة المالية 5000");
  });
  test("failed files tell the agent to ask for another version", () => {
    const ctx = buildDocumentContext([{ id: "1", file_name: "a.pdf", summary: null, extracted_text: null, status: "failed", error: "محمي", message_id: "m" }], ["1"], "");
    expect(ctx).toContain("تعذّرت قراءته");
  });
});
