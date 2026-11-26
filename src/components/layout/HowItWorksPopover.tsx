import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DAILY_DIFFICULTY } from "@/features/daily/daily";
import { DIFFICULTIES, DIFFICULTY_KEYS } from "@/features/game/logic";
import type { Difficulty } from "@/features/game/logic";
import { useSettings } from "@/features/game/store/settings";
import { CircleHelp } from "lucide-react";
import { useTranslation } from "react-i18next";

// With Auto check on there is no Check step or Check button (0008).
const getStepKeys = (isAutoSubmit: boolean) =>
  [
    "help.step1",
    "help.stepRemove",
    isAutoSubmit ? "help.step2Auto" : "help.step2",
    "help.step3",
    "help.step4",
    "help.step5",
    "help.step6",
  ] as const;

// Mirrors the shortcuts handled in Play.tsx.
const KEYBOARD_KEYS = [
  "help.keyboardColors",
  "help.keyboardUndo",
  "help.keyboardCheck",
] as const;

type HowItWorksPopoverProps = {
  isDailyPage: boolean;
};

/*
 * Game rules in a popover, modelled on singing-experience's
 * ProgramHelpButton: title, one-line description, numbered steps. The
 * difficulty list reads DIFFICULTIES so it can't drift from the real rules.
 * On the daily page the daily section leads and the difficulty list gives way
 * to the daily's own rules: there is no difficulty to pick there.
 */
export function HowItWorksPopover({ isDailyPage }: HowItWorksPopoverProps) {
  const { t } = useTranslation();
  const isDailyEnabled = useSettings((state) => state.isDailyEnabled);
  const isAutoSubmit = useSettings((state) => state.isAutoSubmit);
  // The shield bull helps only in practice, and only with hints on (0011).
  const hasHintStep =
    useSettings((state) => state.isHintsEnabled) && !isDailyPage;

  const formatRules = (difficulty: Difficulty) => {
    const config = DIFFICULTIES[difficulty];

    return [
      t("difficulty.details", { pegs: config.pegs, colors: config.colors }),
      t("help.guesses", { count: config.maxGuesses }),
      config.allowRepeats ? t("help.repeats") : t("help.noRepeats"),
    ].join(" · ");
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label={t("help.button")}
          title={t("help.button")}
          className="text-subtle hover:text-foreground"
        >
          <CircleHelp className="size-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        collisionPadding={16}
        // max-w keeps the same 16px gutter as collisionPadding on a 320px phone.
        className="max-h-(--radix-popover-content-available-height) w-80 max-w-[calc(100vw-2rem)] gap-4 overflow-y-auto p-4"
      >
        <PopoverHeader>
          <PopoverTitle className="text-base font-semibold">
            {t("app.title")}
          </PopoverTitle>
          <PopoverDescription>{t("help.description")}</PopoverDescription>
        </PopoverHeader>

        {isDailyPage && (
          <section>
            <h3 className="mb-1 font-semibold">{t("daily.title")}</h3>
            <p>{t("daily.description")}</p>
            <p className="text-muted-foreground">
              {formatRules(DAILY_DIFFICULTY)}
            </p>
          </section>
        )}

        <section>
          <h3 className="mb-1 font-semibold">{t("help.stepsTitle")}</h3>
          <ol className="list-decimal space-y-1 ps-5">
            {getStepKeys(isAutoSubmit).map((key) => (
              <li key={key}>{t(key)}</li>
            ))}
            {hasHintStep && <li>{t("help.stepBull")}</li>}
          </ol>
        </section>

        {/* Touch-only devices have no keyboard to use these shortcuts with. */}
        <section className="pointer-coarse:hidden">
          <h3 className="mb-1 font-semibold">{t("help.keyboardTitle")}</h3>
          <ul className="list-disc space-y-1 ps-5">
            {KEYBOARD_KEYS.map((key) => (
              <li key={key}>{t(key)}</li>
            ))}
          </ul>
        </section>

        {!isDailyPage && (
          <section>
            <h3 className="mb-1 font-semibold">
              {t("help.difficultiesTitle")}
            </h3>
            <dl className="space-y-2">
              {DIFFICULTY_KEYS.map((difficulty) => (
                <div key={difficulty}>
                  <dt className="font-medium">
                    {t(`difficulty.${difficulty}`)}
                  </dt>
                  <dd className="text-muted-foreground">
                    {formatRules(difficulty)}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {!isDailyPage && isDailyEnabled && (
          <section>
            <h3 className="mb-1 font-semibold">{t("daily.title")}</h3>
            <p className="text-muted-foreground">{t("daily.description")}</p>
          </section>
        )}
      </PopoverContent>
    </Popover>
  );
}
