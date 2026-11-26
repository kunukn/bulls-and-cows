import { ChevronDown, Globe, LoaderCircle } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/cn";
import { loadLanguage } from "./index";
import {
  isLanguage,
  LANGUAGES,
  LANGUAGE_STORAGE_KEY,
  type Language,
} from "./languages";

/*
 * Current language first, then the browser's preferred ones, then the rest in
 * LANGUAGES order (by speaker count) — so a player spots theirs quickly.
 */
function orderLanguages(current: string) {
  const preferred = [
    current,
    ...(navigator.languages ?? []).map(
      (tag) => tag.toLowerCase().split("-")[0],
    ),
  ].filter(isLanguage);
  const codes = [
    ...new Set<Language>([...preferred, ...LANGUAGES.map((l) => l.code)]),
  ];

  return codes.map((code) =>
    LANGUAGES.find((language) => language.code === code)!,
  );
}

function saveLanguage(language: Language) {
  try {
    // JSON, to stay compatible with values saved by earlier versions.
    localStorage.setItem(LANGUAGE_STORAGE_KEY, JSON.stringify(language));
  } catch {
    // Storage blocked (private mode): the choice lasts for this visit only.
  }
}

type Props = {
  id: string;
};

/* Native <select>: OS picker on phones, full keyboard support, no extra JS. */
export function LanguageSelect({ id }: Props) {
  const { t, i18n } = useTranslation();
  // Ordered once per mount, so the list doesn't reshuffle while choosing.
  const [options] = useState(() => orderLanguages(i18n.language));
  // The pick whose strings are still being fetched, if any.
  const [pending, setPending] = useState<Language | null>(null);
  const [hasFailed, setHasFailed] = useState(false);
  const latestPick = useRef<Language | null>(null);
  const StatusIcon = pending ? LoaderCircle : ChevronDown;

  /*
   * The page stays in the current language until the new one has loaded, then
   * switches in one step: no half-translated screen in between.
   */
  async function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value;
    if (!isLanguage(next)) return;

    latestPick.current = next;
    setPending(next);
    setHasFailed(false);

    const isLoaded = await loadLanguage(next).then(
      () => true,
      () => false,
    );
    // A newer pick takes over from a slower, earlier one.
    if (latestPick.current !== next) return;

    if (isLoaded) {
      saveLanguage(next);
      await i18n.changeLanguage(next);
    }
    setPending(null);
    setHasFailed(!isLoaded);
  }

  return (
    <>
      <div className="relative">
        <Globe className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <select
          id={id}
          value={pending ?? i18n.language}
          onChange={(event) => void handleChange(event)}
          aria-busy={pending !== null}
          aria-describedby={hasFailed ? `${id}-error` : undefined}
          className="w-full appearance-none rounded-lg border border-input bg-background py-2 ps-9 pe-9 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {options.map(({ code, label }) => (
            <option key={code} value={code} lang={code}>
              {label}
            </option>
          ))}
        </select>
        <StatusIcon
          className={cn(
            "pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground",
            pending && "motion-safe:animate-spin",
          )}
        />
      </div>
      {hasFailed && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {t("common.languageLoadFailed")}
        </p>
      )}
    </>
  );
}
