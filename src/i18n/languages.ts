/* Supported UI languages, labelled in their own language (endonyms). */
export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
  { code: "hi", label: "हिन्दी" },
  { code: "ar", label: "العربية" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "da", label: "Dansk" },
] as const;

export type Language = (typeof LANGUAGES)[number]["code"];

export const LANGUAGE_CODES: readonly Language[] = LANGUAGES.map(
  (language) => language.code,
);

/* BCP 47 tag for <html lang>: `zh` is Simplified Chinese. */
export const HTML_LANG: Record<Language, string> = {
  en: "en",
  zh: "zh-Hans",
  hi: "hi",
  ar: "ar",
  fr: "fr",
  de: "de",
  da: "da",
};

/* Right-to-left languages; everything else renders left-to-right. */
const RTL_LANGUAGES: ReadonlySet<Language> = new Set<Language>(["ar"]);

export function getDirection(language: string): "ltr" | "rtl" {
  return isLanguage(language) && RTL_LANGUAGES.has(language) ? "rtl" : "ltr";
}

/* localStorage key (JSON string), written by LanguageSelect. */
export const LANGUAGE_STORAGE_KEY = "app:language";

export function isLanguage(value: unknown): value is Language {
  return LANGUAGE_CODES.includes(value as Language);
}
