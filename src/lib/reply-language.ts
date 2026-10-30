/** Conversation language is independent of the brand's content dialect. */
export function replyLanguage(message: string): "en" | "ar" | "auto" {
  if (/(?:reply|respond|answer|speak|talk)(?:\s+to\s+me)?\s+(?:only\s+)?(?:in\s+)?english\b/i.test(message) || /(?:رد|أجب|اجب|جاوب|كلمني).*?(?:بالإنجليزي|بالانجليزي|بالإنجليزية|بالانجليزية)/u.test(message)) return "en";
  if (/(?:reply|respond|answer|speak|talk)(?:\s+to\s+me)?\s+(?:only\s+)?(?:in\s+)?arabic\b/i.test(message) || /(?:رد|أجب|اجب|جاوب|كلمني).*?بالعربي/u.test(message)) return "ar";
  const prose = message.replace(/https?:\/\/\S+/g, "").replace(/`[^`]*`/g, "");
  const arabic = prose.match(/\p{Script=Arabic}/gu)?.length ?? 0;
  const latin = prose.match(/[a-z]/gi)?.length ?? 0;
  if (arabic > latin) return "ar";
  if (latin > 0 && arabic === 0) return "en";
  return "auto";
}

export function replyLanguageBlock(message: string): string {
  const language = replyLanguage(message);
  return [
    "## Conversation language (overrides style and brand dialect defaults, never safety or evidence rules)",
    language === "en" ? "Reply to the user in English." : language === "ar" ? "Reply to the user in Arabic." : "Reply in the language of the latest user message; honor any explicit requested reply language.",
    "Do not copy the language of earlier assistant messages, internal instructions, research, or the brand country. Translate headings, explanations, summaries and alt text into the reply language. Keep JSON keys and technical identifiers unchanged.",
    "For requested public-facing content, honor its explicitly requested language separately; use brand audience dialect only when no content language was requested. Arabic style rules apply only to Arabic text.",
  ].join("\n");
}