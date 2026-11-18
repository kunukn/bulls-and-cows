/* Supported UI languages, labelled in their own language (endonyms). */
export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
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
  fr: "fr",
  de: "de",
  da: "da",
};

/* localStorage keys, written by LanguageSwitcher via usehooks-ts (JSON). */
export const LANGUAGE_STORAGE_KEY = "bulls-and-cows:language";
export const RECENT_LANGUAGES_STORAGE_KEY = "bulls-and-cows:language-recents";

export function isLanguage(value: unknown): value is Language {
  return LANGUAGE_CODES.includes(value as Language);
}
