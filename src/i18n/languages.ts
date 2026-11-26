/* Supported UI languages, labelled in their own language (endonyms). */
export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
  { code: "hi", label: "हिन्दी" },
  { code: "es", label: "Español" },
  { code: "ar", label: "العربية" },
  { code: "fr", label: "Français" },
  { code: "bn", label: "বাংলা" },
  { code: "pt", label: "Português" },
  { code: "ru", label: "Русский" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "de", label: "Deutsch" },
  { code: "ja", label: "日本語" },
  { code: "sw", label: "Kiswahili" },
  { code: "da", label: "Dansk" },
] as const;

export type Language = (typeof LANGUAGES)[number]["code"];

export const LANGUAGE_CODES: readonly Language[] = LANGUAGES.map(
  (language) => language.code,
);

/*
 * BCP 47 tag for <html lang>: `zh` is Simplified Chinese, `pt` is Brazilian
 * Portuguese.
 */
export const HTML_LANG: Record<Language, string> = {
  en: "en",
  zh: "zh-Hans",
  hi: "hi",
  es: "es",
  ar: "ar",
  fr: "fr",
  bn: "bn",
  pt: "pt-BR",
  ru: "ru",
  id: "id",
  de: "de",
  ja: "ja",
  sw: "sw",
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
