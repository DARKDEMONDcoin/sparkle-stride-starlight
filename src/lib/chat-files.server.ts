import JSZip from "jszip";
import { chatFileError, chatFileExt } from "./chat-files";

export type Extracted = { text: string; summary: string };

/** خطأ يُعرض للمستخدم كما هو (ملف تالف/محمي/فارغ). */
export class FileReadError extends Error {}

const MAX_STORED_CHARS = 1_500_000;
const LARGE_SHEET_ROWS = 200;

const decodeXml = (s: string) =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");

/** نص فقرة Word: يجمع w:t ويحوّل الفواصل والتبويبات. */
function paragraphText(xml: string) {
  return decodeXml(
    xml
      .replace(/<w:tab\/>/g, "\t")
      .replace(/<w:br[^>]*\/>/g, "\n")
      .replace(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g, "\u0001$1\u0002")
      .replace(/<[^>]+>/g, "")
      .replace(/\u0001|\u0002/g, ""),
  ).trim();
}

function paragraphLine(xml: string) {
  const text = paragraphText(xml);
  if (!text) return "";
  const style = xml.match(/<w:pStyle w:val="([^"]+)"/)?.[1] ?? "";
  const level = style.match(/^(?:Heading|heading|Title)(\d)?/);
  if (level) return `${"#".repeat(Math.min(Number(level[1] ?? 1), 4))} ${text}`;
  if (/<w:numPr[ >/]/.test(xml)) return `- ${text}`;
  return text;
}

/** Word: عناوين وقوائم وفقرات وجداول بترتيبها في المستند. */
export function docxXmlToText(xml: string): string {
  const body = xml.match(/<w:body>([\s\S]*)<\/w:body>/)?.[1] ?? xml;
  const out: string[] = [];
  const re = /<w:tbl>([\s\S]*?)<\/w:tbl>|<w:p[ >][\s\S]*?<\/w:p>|<w:p\/>/g;
  for (const m of body.matchAll(re)) {
    if (m[1] !== undefined) {
      const rows = [...m[1].matchAll(/<w:tr[ >][\s\S]*?<\/w:tr>/g)].map((row) =>
        [...row[0].matchAll(/<w:tc>([\s\S]*?)<\/w:tc>/g)]
          .map((cell) => [...(cell[1] ?? "").matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)].map((p) => paragraphText(p[0])).join(" ").trim())
          .join(" | "),
      );
      if (rows.length) out.push(`[جدول]\n${rows.map((r) => `| ${r} |`).join("\n")}`);
    } else {
      const line = paragraphLine(m[0]);
      if (line) out.push(line);
    }
  }
  return out.join("\n");
}

/** Word القديم (.doc): استخراج تقريبي لسلاسل النص UTF-16. */
function legacyDocText(bytes: Uint8Array) {
  const runs: string[] = [];
  let cur = "";
  for (let i = 0; i + 1 < bytes.length; i += 2) {
    const code = bytes[i]! | (bytes[i + 1]! << 8);
    const ok =
      code === 10 || code === 13 || code === 9 ||
      (code >= 32 && code < 0x7f) || (code >= 0x0600 && code <= 0x06ff) || (code >= 0xa0 && code < 0x2000);
    if (ok) cur += code === 13 ? "\n" : String.fromCharCode(code);
    else {
      if (cur.replace(/\s/g, "").length >= 6) runs.push(cur);
      cur = "";
    }
  }
  if (cur.replace(/\s/g, "").length >= 6) runs.push(cur);
  return runs.join("\n").replace(/\n{3,}/g, "\n\n");
}

async function sheetsText(bytes: Uint8Array, csv: boolean): Promise<Extracted> {
  const { read, utils } = await import("xlsx");
  let book;
  try {
    book = csv
      ? read(new TextDecoder("utf-8").decode(bytes), { type: "string" })
      : read(bytes, { type: "array", cellFormula: false, cellHTML: false });
  } catch (e) {
    if (/password|encrypt/i.test(String(e))) throw new FileReadError("المصنف محمي بكلمة مرور. ارفع نسخة بدون حماية.");
    throw new FileReadError("تعذّرت قراءة المصنف؛ قد يكون تالفاً. ارفع نسخة أخرى.");
  }
  if (book.SheetNames.length > 50) throw new FileReadError("المصنف يحتوي أكثر من 50 ورقة؛ قسّمه.");
  const full: string[] = [];
  const summary: string[] = [];
  for (const name of book.SheetNames) {
    const sheet = book.Sheets[name];
    if (!sheet) continue;
    const rows = utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false, defval: "" });
    if (!rows.length) continue;
    const headers = (rows[0] ?? []).map(String);
    const dataRows = rows.length - 1;
    const line = (r: unknown[]) => r.map((v) => String(v ?? "").replace(/\s+/g, " ")).join(" | ");
    summary.push(`ورقة «${name}»: ${dataRows} صف · الأعمدة: ${headers.join("، ")}`);
    const head = `## ورقة: ${name}\nالأعمدة: ${headers.join(" | ")}\nعدد الصفوف: ${dataRows}`;
    if (dataRows > LARGE_SHEET_ROWS) {
      full.push(`${head}\nعينة أول 15 صف:\n${rows.slice(1, 16).map(line).join("\n")}\n\nالبيانات الكاملة:\n${rows.slice(1).map((r, i) => `${i + 1}. ${line(r)}`).join("\n")}`);
    } else {
      full.push(`${head}\n${rows.slice(1).map(line).join("\n")}`);
    }
  }
  return { text: full.join("\n\n"), summary: summary.join("\n") };
}

/** يستخرج محتوى المستند بحسب نوعه، مع رسائل واضحة للملفات غير القابلة للقراءة. */
export async function extractChatFile(name: string, bytes: Uint8Array): Promise<Extracted> {
  const invalid = chatFileError({ name, size: bytes.byteLength });
  if (invalid) throw new FileReadError(invalid);
  const ext = chatFileExt(name);
  let result: Extracted;

  if (ext === "pdf") {
    if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") throw new FileReadError("الملف ليس PDF صالحاً أو أنه تالف.");
    const { getDocumentProxy, extractText } = await import("unpdf");
    let pdf;
    try {
      pdf = await getDocumentProxy(bytes.slice());
    } catch (e) {
      if (/password/i.test(String((e as { name?: string })?.name ?? e))) throw new FileReadError("ملف PDF محمي بكلمة مرور. ارفع نسخة بدون حماية.");
      throw new FileReadError("تعذّر فتح ملف PDF؛ قد يكون تالفاً. ارفع نسخة أخرى.");
    }
    try {
      const pages = (await extractText(pdf, { mergePages: false })).text as string[];
      let text = pages.map((p, i) => `--- صفحة ${i + 1} ---\n${p.trim()}`).join("\n\n");
      const letters = pages.join("").replace(/\s/g, "").length;
      let scanned = false;
      if (letters < 40 * Math.max(1, Math.min(pages.length, 3))) {
        const { readScannedPdf } = await import("./media-vision.server");
        const ocr = await readScannedPdf(bytes, name).catch(() => "");
        if (ocr.trim()) { text = ocr; scanned = true; }
      }
      result = { text, summary: `PDF · ${pdf.numPages} صفحة${scanned ? " · ممسوح ضوئياً (قُرئ بصرياً)" : ""}` };
    } finally {
      await pdf.cleanup();
    }
  } else if (ext === "docx" || ext === "xlsx") {
    let zip: JSZip;
    try { zip = await JSZip.loadAsync(bytes); } catch {
      throw new FileReadError("تعذّر فتح الملف؛ قد يكون تالفاً أو محمياً بكلمة مرور. ارفع نسخة أخرى.");
    }
    if (Object.keys(zip.files).length > 4000) throw new FileReadError("الملف معقّد جداً؛ قسّمه إلى ملفات أصغر.");
    if (ext === "docx") {
      const part = zip.file("word/document.xml");
      if (!part) throw new FileReadError("ملف Word غير صالح أو محمي.");
      const text = docxXmlToText(await part.async("string"));
      const headings = text.split("\n").filter((l) => l.startsWith("#")).length;
      const tables = (text.match(/\[جدول\]/g) ?? []).length;
      result = { text, summary: `Word · ${text.split(/\s+/).length} كلمة · ${headings} عنوان · ${tables} جدول` };
    } else result = await sheetsText(bytes, false);
  } else if (ext === "xls") result = await sheetsText(bytes, false);
  else if (ext === "csv") result = await sheetsText(bytes, true);
  else {
    const text = legacyDocText(bytes);
    result = { text, summary: `Word (صيغة قديمة) · ${text.split(/\s+/).length} كلمة` };
  }

  const text = result.text.replace(/\u0000/g, "").trim();
  if (text.replace(/[\s|#\-–]/g, "").length < 10)
    throw new FileReadError("لم أجد نصاً قابلاً للقراءة في الملف (قد يكون فارغاً أو صوراً فقط). ارفع نسخة أخرى.");
  return { text: text.slice(0, MAX_STORED_CHARS), summary: result.summary };
}

/** تقطيع المحتوى إلى أجزاء متداخلة قليلاً لتناسب نافذة النموذج. */
export function chunkText(text: string, size = 3000): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    let end = Math.min(text.length, i + size);
    if (end < text.length) {
      const nl = text.lastIndexOf("\n", end);
      if (nl > i + size * 0.6) end = nl;
    }
    chunks.push(text.slice(i, end));
    i = end;
  }
  return chunks;
}

const tokens = (s: string) =>
  new Set(
    s.toLowerCase()
      .replace(/[\u064B-\u0652]/g, "")
      .split(/[^\p{L}\p{N}]+/u)
      .filter((t) => t.length > 2),
  );

/** اختيار الأجزاء الأقرب للسؤال مع إبقاء بداية الملف دائماً. */
export function relevantExcerpt(text: string, question: string, budget: number): string {
  if (text.length <= budget) return text;
  const chunks = chunkText(text);
  const q = tokens(question);
  const scored = chunks.map((c, i) => {
    const t = tokens(c);
    let hits = 0;
    for (const w of q) if (t.has(w)) hits++;
    return { i, hits };
  });
  const picked = new Set<number>([0]);
  let used = chunks[0]!.length;
  for (const s of scored.filter((s) => s.hits > 0).sort((a, b) => b.hits - a.hits)) {
    if (used + chunks[s.i]!.length > budget) continue;
    picked.add(s.i);
    used += chunks[s.i]!.length;
  }
  return [...picked]
    .sort((a, b) => a - b)
    .map((i) => (i === 0 ? chunks[i] : `[… جزء ${i + 1} من ${chunks.length}]\n${chunks[i]}`))
    .join("\n\n") + `\n\n[المستند طويل (${chunks.length} جزءاً)؛ عُرضت الأجزاء الأقرب للسؤال فقط. اطلب من المستخدم تحديد القسم إن احتجت جزءاً آخر.]`;
}

export type ContextDoc = { id: string; file_name: string; summary: string | null; extracted_text: string | null; status: string; error: string | null; message_id: string | null };

/** كتلة سياق المستندات: ملفات هذه الرسالة بتوسّع، والسابقة بالأجزاء ذات الصلة. */
export function buildDocumentContext(docs: ContextDoc[], currentIds: string[], question: string): string {
  if (!docs.length) return "";
  const current = docs.filter((d) => currentIds.includes(d.id));
  const older = docs.filter((d) => !currentIds.includes(d.id) && d.status === "ready").slice(-6);
  const curBudget = Math.floor(36_000 / Math.max(1, current.length));
  const oldBudget = Math.floor(12_000 / Math.max(1, older.length));
  const block = (d: ContextDoc, budget: number) =>
    d.status === "ready" && d.extracted_text
      ? `### ملف «${d.file_name}» (${d.summary ?? ""})\n${relevantExcerpt(d.extracted_text, question, budget)}`
      : `### ملف «${d.file_name}»: تعذّرت قراءته — ${d.error ?? "سبب غير معروف"}. أخبر المستخدم بذلك بوضوح واطلب نسخة أخرى.`;
  return [
    current.length ? `## ملفات أرفقها المستخدم مع هذه الرسالة\n${current.map((d) => block(d, curBudget)).join("\n\n")}` : "",
    older.length ? `## ملفات سابقة في هذه المحادثة (ما زالت متاحة للرجوع إليها)\n${older.map((d) => block(d, oldBudget)).join("\n\n")}` : "",
  ].filter(Boolean).join("\n\n");
}

export const DOCUMENT_RULES = `قواعد التعامل مع الملفات المرفقة:
- ابدأ بتأكيد قصير لما استلمته: نوع كل ملف واسمه وما يحتويه وملخص في سطر أو سطرين، وأشر لكل ملف باسمه.
- إن كان طلب المستخدم واضحاً فنفّذه مباشرة بدورك ومهاراتك؛ وإن كان غامضاً فاسأل سؤالاً أو سؤالين قصيرين فقط.
- إن لم يكتب المستخدم أي رسالة: لخّص الملف واقترح 3 خطوات تالية مناسبة لدورك.
- إن تعذّرت قراءة ملف فقل ذلك صراحة واطلب نسخة أخرى، ولا تخترع محتواه.
- اعتمد على نص الملف كما هو؛ لا تخترع أرقاماً أو بنوداً غير موجودة.
- رد بنفس لغة المستخدم (عربي أو إنجليزي).
- إن أنتجت مستنداً معدّلاً أو تقريراً أو جدولاً منظّفاً فاكتبه كاملاً كمخرج (جداول Markdown للبيانات) ليتمكّن المستخدم من تنزيله.`;
