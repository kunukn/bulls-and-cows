import { BoardThemePicker } from "@/components/BoardThemePicker";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  COLOR_SCHEMES,
  PEG_STYLES,
  useSettings,
} from "@/features/game/store/settings";
import { LanguageSelect } from "@/i18n/LanguageSelect";
import { GitHubIcon } from "@/components/icons/GitHubIcon";
import { Settings } from "lucide-react";
import { Direction } from "radix-ui";
import { useTranslation } from "react-i18next";

const REPO_URL = "https://github.com/kunukn/bulls-and-cows";

/*
 * App settings in a side drawer (shadcn Sheet), modelled on
 * singing-experience's SettingsPanel: one stacked section per setting, so
 * future options (e.g. a sound toggle) slot in below Language.
 */
export function SettingsSheet() {
  const { t } = useTranslation();
  const isTimerVisible = useSettings((state) => state.isTimerVisible);
  const setTimerVisible = useSettings((state) => state.setTimerVisible);
  const isHighScoresEnabled = useSettings((state) => state.isHighScoresEnabled);
  const setHighScoresEnabled = useSettings(
    (state) => state.setHighScoresEnabled,
  );
  const isHintsEnabled = useSettings((state) => state.isHintsEnabled);
  const setHintsEnabled = useSettings((state) => state.setHintsEnabled);
  const isMinimalText = useSettings((state) => state.isMinimalText);
  const setMinimalText = useSettings((state) => state.setMinimalText);
  const isAutoSubmit = useSettings((state) => state.isAutoSubmit);
  const setAutoSubmit = useSettings((state) => state.setAutoSubmit);
  const isSoundEnabled = useSettings((state) => state.isSoundEnabled);
  const setSoundEnabled = useSettings((state) => state.setSoundEnabled);
  const isDailyEnabled = useSettings((state) => state.isDailyEnabled);
  const setDailyEnabled = useSettings((state) => state.setDailyEnabled);
  const isPinkBull = useSettings((state) => state.isPinkBull);
  const setPinkBull = useSettings((state) => state.setPinkBull);
  const pegStyle = useSettings((state) => state.pegStyle);
  const setPegStyle = useSettings((state) => state.setPegStyle);
  const colorScheme = useSettings((state) => state.colorScheme);
  const setColorScheme = useSettings((state) => state.setColorScheme);
  const boardTheme = useSettings((state) => state.boardTheme);
  const setBoardTheme = useSettings((state) => state.setBoardTheme);
  // Slide in from the inline end, the side the settings button sits on.
  const side = Direction.useDirection() === "rtl" ? "left" : "right";
  const appVersion = import.meta.env.VITE_APP_VERSION;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label={t("common.settings")}
          title={t("common.settings")}
          className="text-subtle hover:text-foreground"
        >
          <Settings className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side={side}
        closeLabel={t("common.close")}
        // iPadOS opens a <select> when it gets focus; start on the panel instead.
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          (event.currentTarget as HTMLElement).focus();
        }}
        // Scroll the whole drawer so the footer links stay reachable on short screens.
        className="w-80 overflow-y-auto overscroll-contain border-border"
      >
        <SheetHeader>
          <SheetTitle className="text-xl font-bold">
            {t("common.settings")}
          </SheetTitle>
          {/* Radix wants a description for the dialog; hidden visually. */}
          <SheetDescription className="sr-only">
            {t("common.settings")}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="settings-language" className="font-medium">
              {t("common.language")}
            </label>
            <LanguageSelect id="settings-language" />
          </div>
          <fieldset
            className="flex flex-col gap-2"
            aria-describedby="settings-appearance-description"
          >
            <legend className="mb-2 font-medium">
              {t("common.appearance")}
            </legend>
            {/* Native radio group as a segmented control, like DifficultyPicker. */}
            <div className="flex rounded-lg bg-background p-1 ring-1 ring-border">
              {COLOR_SCHEMES.map((scheme) => (
                <label
                  key={scheme}
                  className="flex-1 cursor-pointer rounded-md px-2 py-1.5 text-center text-sm font-medium text-subtle transition-colors has-checked:bg-control has-checked:text-foreground has-focus-visible:outline-2 has-focus-visible:outline-ring"
                >
                  <input
                    type="radio"
                    name="settings-color-scheme"
                    value={scheme}
                    checked={colorScheme === scheme}
                    onChange={() => setColorScheme(scheme)}
                    className="sr-only"
                  />
                  {t(`common.colorSchemes.${scheme}`)}
                </label>
              ))}
            </div>
            <p
              id="settings-appearance-description"
              className="text-sm text-muted-foreground"
            >
              {t("common.appearanceDescription")}
            </p>
          </fieldset>
          <fieldset
            className="flex flex-col gap-2"
            aria-describedby="settings-peg-style-description"
          >
            <legend className="mb-2 font-medium">{t("common.pegStyle")}</legend>
            {/* Three options in one group, so colour and shape can't both be off (0004). */}
            <div className="flex rounded-lg bg-background p-1 ring-1 ring-border">
              {PEG_STYLES.map((style) => (
                <label
                  key={style}
                  className="flex-1 cursor-pointer rounded-md px-2 py-1.5 text-center text-sm font-medium text-subtle transition-colors has-checked:bg-control has-checked:text-foreground has-focus-visible:outline-2 has-focus-visible:outline-ring"
                >
                  <input
                    type="radio"
                    name="settings-peg-style"
                    value={style}
                    checked={pegStyle === style}
                    onChange={() => setPegStyle(style)}
                    className="sr-only"
                  />
                  {t(`common.pegStyles.${style}`)}
                </label>
              ))}
            </div>
            <p
              id="settings-peg-style-description"
              className="text-sm text-muted-foreground"
            >
              {t("common.pegStyleDescription")}
            </p>
          </fieldset>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="settings-sound" className="font-medium">
                {t("common.sound")}
              </label>
              <Switch
                id="settings-sound"
                checked={isSoundEnabled}
                onCheckedChange={setSoundEnabled}
                aria-describedby="settings-sound-description"
              />
            </div>
            <p
              id="settings-sound-description"
              className="text-sm text-muted-foreground"
            >
              {t("common.soundDescription")}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="settings-minimal-text" className="font-medium">
                {t("common.minimalText")}
              </label>
              <Switch
                id="settings-minimal-text"
                checked={isMinimalText}
                onCheckedChange={setMinimalText}
                aria-describedby="settings-minimal-text-description"
              />
            </div>
            <p
              id="settings-minimal-text-description"
              className="text-sm text-muted-foreground"
            >
              {t("common.minimalTextDescription")}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="settings-auto-submit" className="font-medium">
                {t("common.autoSubmit")}
              </label>
              <Switch
                id="settings-auto-submit"
                checked={isAutoSubmit}
                onCheckedChange={setAutoSubmit}
                aria-describedby="settings-auto-submit-description"
              />
            </div>
            <p
              id="settings-auto-submit-description"
              className="text-sm text-muted-foreground"
            >
              {t("common.autoSubmitDescription")}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="settings-timer" className="font-medium">
                {t("common.showTimer")}
              </label>
              <Switch
                id="settings-timer"
                checked={isTimerVisible}
                onCheckedChange={setTimerVisible}
                aria-describedby="settings-timer-description"
              />
            </div>
            <p
              id="settings-timer-description"
              className="text-sm text-muted-foreground"
            >
              {t("common.showTimerDescription")}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="settings-high-scores" className="font-medium">
                {t("nav.highScores")}
              </label>
              <Switch
                id="settings-high-scores"
                checked={isHighScoresEnabled}
                onCheckedChange={setHighScoresEnabled}
                aria-describedby="settings-high-scores-description"
              />
            </div>
            <p
              id="settings-high-scores-description"
              className="text-sm text-muted-foreground"
            >
              {t("common.highScoresDescription")}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="settings-hints" className="font-medium">
                {t("common.hints")}
              </label>
              <Switch
                id="settings-hints"
                checked={isHintsEnabled}
                onCheckedChange={setHintsEnabled}
                aria-describedby="settings-hints-description"
              />
            </div>
            <p
              id="settings-hints-description"
              className="text-sm text-muted-foreground"
            >
              {t("common.hintsDescription")}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="settings-daily" className="font-medium">
                {t("daily.title")}
              </label>
              <Switch
                id="settings-daily"
                checked={isDailyEnabled}
                onCheckedChange={setDailyEnabled}
                aria-describedby="settings-daily-description"
              />
            </div>
            <p
              id="settings-daily-description"
              className="text-sm text-muted-foreground"
            >
              {t("common.dailyDescription")}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="settings-pink-bull" className="font-medium">
                {t("common.pinkBull")}
              </label>
              <Switch
                id="settings-pink-bull"
                checked={isPinkBull}
                onCheckedChange={setPinkBull}
                aria-describedby="settings-pink-bull-description"
              />
            </div>
            <p
              id="settings-pink-bull-description"
              className="text-sm text-muted-foreground"
            >
              {t("common.pinkBullDescription")}
            </p>
          </div>
          <BoardThemePicker
            name="settings-board-theme"
            legend={t("common.boardTheme")}
            value={boardTheme}
            onChange={setBoardTheme}
          />
        </div>

        <SheetFooter className="items-end gap-3 text-xs text-muted-foreground">
          <p className="leading-none">
            {t("common.version")}: {appVersion}
          </p>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-foreground"
          >
            <GitHubIcon className="size-4" />
            {t("common.sourceCode")}
            <span className="sr-only">{t("common.opensInNewTab")}</span>
          </a>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
