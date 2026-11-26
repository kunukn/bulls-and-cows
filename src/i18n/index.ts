import i18n, { type ResourceKey } from "i18next";
import { initReactI18next } from "react-i18next";
import {
  getDirection,
  getIntlLocale,
  HTML_LANG,
  isLanguage,
  LANGUAGE_CODES,
  LANGUAGE_STORAGE_KEY,
  type Language,
} from "./languages";
import en from "./locales/en.json";

/*
 * Only English, the fallback, is bundled. Every other language is its own
 * chunk, fetched when it is first needed: at startup for a player whose
 * language isn't English, or when one is picked in Settings. The service
 * worker precaches the chunks like any other script (0003), so switching
 * works offline once it has installed.
 */
const loaders = import.meta.glob<ResourceKey>(
  ["./locales/*.json", "!./locales/en.json"],
  { import: "default" },
);

/*
 * Makes a language's strings available to `i18n.changeLanguage`. Rejects when
 * the chunk can't be fetched: offline before the service worker cached it.
 */
export async function loadLanguage(language: Language): Promise<void> {
  if (i18n.hasResourceBundle(language, "translation")) return;

  const translation = await loaders[`./locales/${language}.json`]();
  i18n.addResourceBundle(language, "translation", translation);
}

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

const initialLanguage = detectInitialLanguage();

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: initialLanguage,
  fallbackLng: "en",
  supportedLngs: [...LANGUAGE_CODES],
  interpolation: { escapeValue: false }, // React already escapes.
});

/*
 * `{{x, number}}` in a string: i18next gives `Intl` the bare language, so
 * replace its formatter with one that uses the pinned locale.
 */
i18n.services.formatter?.add(
  "number",
  (value: number, language: string | undefined, options: object) =>
    new Intl.NumberFormat(
      getIntlLocale(language ?? i18n.language),
      options,
    ).format(value),
);

/* Developer-only marker, so a localhost tab stands apart from tyrko.app; not translated. */
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);
const titlePrefix = LOCAL_HOSTNAMES.has(location.hostname) ? "(local) " : "";

/* Keep <html lang>, <html dir> and the tab title in sync with the active language. */
function syncDocument(language: string) {
  document.documentElement.lang = isLanguage(language)
    ? HTML_LANG[language]
    : language;
  document.documentElement.dir = getDirection(language);
  document.title = titlePrefix + i18n.t("app.documentTitle");
}

/*
 * Resolves once the starting language's strings are in. main.tsx holds the
 * first render for it, so a returning player never sees English flash before
 * their own language. Never rejects: if the chunk can't be fetched the app
 * starts in English, and the saved choice is tried again on the next visit.
 */
export const i18nReady: Promise<void> = loadLanguage(initialLanguage)
  .catch(() => i18n.changeLanguage("en"))
  .then(() => {
    syncDocument(i18n.language);
    i18n.on("languageChanged", syncDocument);
  });

export { i18n };
