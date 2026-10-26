/** Converts Arabic-Indic (٠-٩) and Persian (۰-۹) digits and separators to Western forms. */
export function toWesternDigits(text: string): string {
  return text
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/(\d)٬(?=\d)/g, "$1,")
    .replace(/(\d)٫(?=\d)/g, "$1.");
}
