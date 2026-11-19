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
import { useSettings } from "@/features/game/store/settings";
import { LanguageSelect } from "@/i18n/LanguageSelect";
import { GitHubIcon } from "@/components/icons/GitHubIcon";
import { Bug, Settings } from "lucide-react";
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
  const isMinimalText = useSettings((state) => state.isMinimalText);
  const setMinimalText = useSettings((state) => state.setMinimalText);
  const isAutoSubmit = useSettings((state) => state.isAutoSubmit);
  const setAutoSubmit = useSettings((state) => state.setAutoSubmit);
  const isSoundEnabled = useSettings((state) => state.isSoundEnabled);
  const setSoundEnabled = useSettings((state) => state.setSoundEnabled);
  const isPinkBull = useSettings((state) => state.isPinkBull);
  const setPinkBull = useSettings((state) => state.setPinkBull);
  const isPegShapes = useSettings((state) => state.isPegShapes);
  const setPegShapes = useSettings((state) => state.setPegShapes);
  const boardTheme = useSettings((state) => state.boardTheme);
  const setBoardTheme = useSettings((state) => state.setBoardTheme);
  // Slide in from the inline end, the side the settings button sits on.
  const side = Direction.useDirection() === "rtl" ? "left" : "right";
  const appVersion = import.meta.env.VITE_APP_VERSION;
  // Prefill the build so every report says which version it came from.
  const issueUrl = `${REPO_URL}/issues/new?${new URLSearchParams({
    body: `${t("common.version")}: ${appVersion}\n\n`,
  })}`;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label={t("common.settings")}
          title={t("common.settings")}
          className="text-slate-300 hover:text-white"
        >
          <Settings className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side={side}
        closeLabel={t("common.close")}
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
              <label htmlFor="settings-peg-shapes" className="font-medium">
                {t("common.pegShapes")}
              </label>
              <Switch
                id="settings-peg-shapes"
                checked={isPegShapes}
                onCheckedChange={setPegShapes}
                aria-describedby="settings-peg-shapes-description"
              />
            </div>
            <p
              id="settings-peg-shapes-description"
              className="text-sm text-muted-foreground"
            >
              {t("common.pegShapesDescription")}
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
          <a
            href={issueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-foreground"
          >
            <Bug className="size-4" aria-hidden="true" />
            {t("common.reportIssue")}
            <span className="sr-only">{t("common.opensInNewTab")}</span>
          </a>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
