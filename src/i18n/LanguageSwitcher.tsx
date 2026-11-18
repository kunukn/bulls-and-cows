import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Settings } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocalStorage } from "usehooks-ts";
import { detectInitialLanguage } from "./index";
import {
  isLanguage,
  LANGUAGES,
  LANGUAGE_STORAGE_KEY,
  RECENT_LANGUAGES_STORAGE_KEY,
  type Language,
} from "./languages";

const MAX_PINNED = 3;

/*
 * Settings popover in the header: language choice (current and recently used
 * languages pinned on top) and the build stamp. Pattern from
 * perceptual-speed-game's LanguageSwitcher.
 */
export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useLocalStorage<Language>(
    LANGUAGE_STORAGE_KEY,
    detectInitialLanguage,
  );
  const [recents, setRecents] = useLocalStorage<Language[]>(
    RECENT_LANGUAGES_STORAGE_KEY,
    [],
  );

  /* Apply the saved choice on mount and whenever it changes. */
  useEffect(() => {
    if (i18n.language !== language) void i18n.changeLanguage(language);
  }, [language, i18n]);

  function handleSelect(value: string) {
    if (!isLanguage(value)) return;

    setLanguage(value);
    setRecents((previous) =>
      [value, ...previous.filter((code) => code !== value)].slice(
        0,
        MAX_PINNED,
      ),
    );
  }

  const pinnedCodes = [...new Set<Language>([language, ...recents])].slice(
    0,
    MAX_PINNED,
  );
  const pinned = LANGUAGES.filter(({ code }) =>
    pinnedCodes.includes(code),
  ).sort((a, b) => pinnedCodes.indexOf(a.code) - pinnedCodes.indexOf(b.code));
  const rest = LANGUAGES.filter(({ code }) => !pinnedCodes.includes(code));

  const renderItem = ({ code, label }: (typeof LANGUAGES)[number]) => (
    <div key={code} className="flex items-center gap-2">
      <RadioGroupItem id={`language-${code}`} value={code} />
      <Label
        htmlFor={`language-${code}`}
        lang={code}
        className="text-sm font-normal"
      >
        {label}
      </Label>
    </div>
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label={t("common.settings")}
          title={t("common.settings")}
          className="text-slate-300 hover:text-white"
        >
          <Settings className="size-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48">
        <div className="space-y-4">
          <p id="language-heading" className="text-sm font-medium">
            {t("common.language")}
          </p>
          <RadioGroup
            aria-labelledby="language-heading"
            value={language}
            onValueChange={handleSelect}
            className="gap-2"
          >
            {pinned.map(renderItem)}
            {pinned.length > 0 && rest.length > 0 && (
              <div className="border-t border-border" />
            )}
            {rest.map(renderItem)}
          </RadioGroup>
          <p className="border-t border-border px-1 pt-2 text-sm leading-none text-muted-foreground">
            {import.meta.env.VITE_APP_VERSION}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
