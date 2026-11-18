import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DIFFICULTIES, DIFFICULTY_KEYS } from "@/features/game/logic";
import { CircleHelp } from "lucide-react";
import { useTranslation } from "react-i18next";

const STEP_KEYS = [
  "help.step1",
  "help.step2",
  "help.step3",
  "help.step4",
  "help.step5",
  "help.step6",
] as const;

/*
 * Game rules in a popover, modelled on singing-experience's
 * ProgramHelpButton: title, one-line description, numbered steps. The
 * difficulty list reads DIFFICULTIES so it can't drift from the real rules.
 */
export function HowItWorksPopover() {
  const { t } = useTranslation();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label={t("help.button")}
          title={t("help.button")}
          className="text-slate-300 hover:text-white"
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

        <section>
          <h3 className="mb-1 font-semibold">{t("help.stepsTitle")}</h3>
          <ol className="list-decimal space-y-1 ps-5">
            {STEP_KEYS.map((key) => (
              <li key={key}>{t(key)}</li>
            ))}
          </ol>
        </section>

        <section>
          <h3 className="mb-1 font-semibold">{t("help.difficultiesTitle")}</h3>
          <dl className="space-y-2">
            {DIFFICULTY_KEYS.map((difficulty) => {
              const config = DIFFICULTIES[difficulty];

              return (
                <div key={difficulty}>
                  <dt className="font-medium">
                    {t(`difficulty.${difficulty}`)}
                  </dt>
                  <dd className="text-muted-foreground">
                    {[
                      t("difficulty.details", {
                        pegs: config.pegs,
                        colors: config.colors,
                      }),
                      t("help.guesses", { count: config.maxGuesses }),
                      config.allowRepeats
                        ? t("help.repeats")
                        : t("help.noRepeats"),
                    ].join(" · ")}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>
      </PopoverContent>
    </Popover>
  );
}
