import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import {
  HTML_LANG,
  isLanguage,
  LANGUAGE_CODES,
  LANGUAGE_STORAGE_KEY,
  type Language,
} from "./languages";
import da from "./locales/da.json";
import de from "./locales/de.json";
import en from "./locales/en.json";
import fr from "./locales/fr.json";
import zh from "./locales/zh.json";

/*
 * All five languages are bundled (a few KB each), unlike the lazy-loading
 * perceptual-speed-game setup: no Suspense boundary, and no flash of English
 * for a returning player whose saved language isn't English.
 */
const resources = {
  en: { translation: en },
  zh: { translation: zh },
  fr: { translation: fr },
  de: { translation: de },
  da: { translation: da },
};

function readStoredLanguage(): Language | null {
  try {
    const stored: unknown = JSON.parse(
      localStorage.getItem(LANGUAGE_STORAGE_KEY) ?? "null",
    );

    return isLanguage(stored) ? stored : null;
  } catch {
    return null;
  }
}

/*
 * Saved choice first, then the first browser-preferred language we support,
 * matched on the primary subtag (`da-DK` → `da`, `zh-CN` → `zh`), else English.
 */
export function detectInitialLanguage(): Language {
  const stored = readStoredLanguage();
  if (stored) return stored;

  const candidates =
    typeof navigator === "undefined"
      ? []
      : [...(navigator.languages ?? []), navigator.language];

  for (const tag of candidates) {
    const primary = tag?.toLowerCase().split("-")[0];
    if (isLanguage(primary)) return primary;
  }

  return "en";
}

void i18n.use(initReactI18next).init({
  resources,
  lng: detectInitialLanguage(),
  fallbackLng: "en",
  supportedLngs: [...LANGUAGE_CODES],
  interpolation: { escapeValue: false }, // React already escapes.
});

/* Keep <html lang> and the tab title in sync with the active language. */
function syncDocument(language: string) {
  document.documentElement.lang = isLanguage(language)
    ? HTML_LANG[language]
    : language;
  document.title = i18n.t("app.title");
}

syncDocument(i18n.language);
i18n.on("languageChanged", syncDocument);

export { i18n };
