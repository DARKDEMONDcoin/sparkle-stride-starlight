/** تصدير مخرجات الموظف كملفات قابلة للتنزيل (Word / Excel / PDF) في المتصفح. */

const clean = (s: string) => s.replace(/\*\*|__|`/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

/** يستخرج جداول Markdown كمصفوفات صفوف. */
export function markdownTables(md: string): string[][][] {
  const tables: string[][][] = [];
  let cur: string[][] = [];
  for (const line of md.split("\n")) {
    const t = line.trim();
    if (/^\|.*\|$/.test(t)) {
      if (/^\|[\s:|-]+\|$/.test(t)) continue;
      cur.push(t.slice(1, -1).split("|").map((c) => clean(c.trim())));
    } else if (cur.length) {
      tables.push(cur);
      cur = [];
    }
  }
  if (cur.length) tables.push(cur);
  return tables.filter((t) => t.length > 1);
}

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

const rtl = (s: string) => /[\u0600-\u06FF]/.test(s);

export async function exportDocx(md: string, title: string) {
  const { Document, Packer, Paragraph, HeadingLevel, TextRun, Table, TableRow, TableCell, WidthType } = await import("docx");
  const children: (InstanceType<typeof Paragraph> | InstanceType<typeof Table>)[] = [];
  const lines = md.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (/^\|.*\|$/.test(line)) {
      const block: string[] = [];
      while (i < lines.length && /^\|.*\|$/.test(lines[i]!.trim())) block.push(lines[i++]!.trim());
      i--;
      const rows = markdownTables(block.join("\n"))[0];
      if (rows)
        children.push(new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          visuallyRightToLeft: rtl(block.join("")),
          rows: rows.map((r, ri) => new TableRow({
            children: r.map((c) => new TableCell({ children: [new Paragraph({ bidirectional: rtl(c), children: [new TextRun({ text: c, bold: ri === 0, rightToLeft: rtl(c) })] })] })),
          })),
        }));
      continue;
    }
    const h = line.match(/^(#{1,4})\s+(.*)/);
    const bullet = line.match(/^[-*•]\s+(.*)/);
    const text = clean(h?.[2] ?? bullet?.[1] ?? line);
    children.push(new Paragraph({
      bidirectional: rtl(text),
      ...(h ? { heading: [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4][h[1]!.length - 1] } : {}),
      ...(bullet ? { bullet: { level: 0 } } : {}),
      children: [new TextRun({ text, rightToLeft: rtl(text) })],
    }));
  }
  const doc = new Document({ sections: [{ children }] });
  save(await Packer.toBlob(doc), `${title}.docx`);
}

export async function exportXlsx(md: string, title: string) {
  const { utils, write } = await import("xlsx");
  const book = utils.book_new();
  markdownTables(md).forEach((rows, i) => {
    const sheet = utils.aoa_to_sheet(rows.map((r) => r.map((c) => (/^-?\d+(\.\d+)?$/.test(c.replace(/,/g, "")) ? Number(c.replace(/,/g, "")) : c))));
    utils.book_append_sheet(book, sheet, `جدول ${i + 1}`);
  });
  if (!book.SheetNames.length) utils.book_append_sheet(book, utils.aoa_to_sheet(md.split("\n").map((l) => [clean(l)])), "المحتوى");
  save(new Blob([write(book, { type: "array", bookType: "xlsx" })]), `${title}.xlsx`);
}

/** PDF عبر نافذة الطباعة — يحافظ على الخط العربي واتجاه النص بدقة. */
export function exportPdf(html: string, title: string) {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`<!doctype html><html dir="auto"><head><meta charset="utf-8"><title>${title.replace(/</g, "")}</title><style>body{font-family:system-ui,"Segoe UI",Tahoma,sans-serif;line-height:1.8;padding:32px;max-width:800px;margin:auto}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:6px}</style></head><body>${html}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
}
