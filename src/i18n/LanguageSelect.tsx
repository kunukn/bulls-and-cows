import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { i18n } = useTranslation();
  // Ordered once per mount, so the list doesn't reshuffle while choosing.
  const [options] = useState(() => orderLanguages(i18n.language));

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value;
    if (!isLanguage(next)) return;

    saveLanguage(next);
    void i18n.changeLanguage(next);
  }

  return (
    <div className="relative">
      <select
        id={id}
        value={i18n.language}
        onChange={handleChange}
        className="w-full appearance-none rounded-lg border border-input bg-background py-2 ps-3 pe-9 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {options.map(({ code, label }) => (
          <option key={code} value={code} lang={code}>
            {label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
