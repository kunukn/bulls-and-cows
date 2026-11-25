import {
  DIFFICULTIES,
  DIFFICULTY_KEYS,
  type Difficulty,
} from "@/features/game/logic";
import { useSettings } from "@/features/game/store/settings";
import { Circle, Palette, Star } from "lucide-react";
import { useTranslation } from "react-i18next";

type Props = {
  value: Difficulty;
  onChange: (difficulty: Difficulty) => void;
  name: string;
  legend: string;
};

/*
 * Lucide's palette draws its four paint dots as <circle>s after the outline.
 * Paint them like pegs (clockwise from the left: red, yellow, green, blue) and
 * thicken them, or the colour doesn't show at 16px. Dimmed so they don't
 * outshine the board's real pegs.
 */
const COLOURFUL_PALETTE_CLASS =
  "[&>circle]:stroke-[3.5] [&>circle]:opacity-60 [&>circle:nth-of-type(1)]:fill-peg-green [&>circle:nth-of-type(1)]:stroke-peg-green [&>circle:nth-of-type(2)]:fill-peg-blue [&>circle:nth-of-type(2)]:stroke-peg-blue [&>circle:nth-of-type(3)]:fill-peg-red [&>circle:nth-of-type(3)]:stroke-peg-red [&>circle:nth-of-type(4)]:fill-peg-yellow [&>circle:nth-of-type(4)]:stroke-peg-yellow";

/* Native radio group styled as a segmented control — arrow-key navigation for free. */
export function DifficultyPicker({ value, onChange, name, legend }: Props) {
  const { t } = useTranslation();
  const isMinimalText = useSettings((state) => state.isMinimalText);

  return (
    <fieldset className="flex rounded-lg bg-card p-1">
      <legend className="sr-only">{legend}</legend>
      {DIFFICULTY_KEYS.map((key, index) => {
        const { pegs, colors, allowRepeats } = DIFFICULTIES[key];

        return (
          <label
            key={key}
            className="group flex-1 cursor-pointer rounded-md px-2 py-1.5 text-center text-sm font-medium text-subtle transition-colors has-checked:bg-control has-checked:text-foreground has-focus-visible:outline-2 has-focus-visible:outline-ring"
          >
            <input
              type="radio"
              name={name}
              value={key}
              checked={value === key}
              onChange={() => onChange(key)}
              className="sr-only"
            />
            {isMinimalText ? (
              // One star per level; the name stays for screen readers + tooltip.
              <span
                title={t(`difficulty.${key}`)}
                className="flex h-5 items-center justify-center gap-0.5"
              >
                {Array.from({ length: index + 1 }, (_, star) => (
                  <Star
                    key={star}
                    aria-hidden
                    className="size-4 fill-current"
                  />
                ))}
                <span className="sr-only">{t(`difficulty.${key}`)}</span>
              </span>
            ) : (
              <>
                {t(`difficulty.${key}`)}
                {/* Icon + count instead of words; the words stay for screen readers + tooltip. */}
                {/* Selected: one step lighter, since muted text fades on the lighter control fill. */}
                <span className="flex items-center justify-center gap-2.5 text-xs font-normal text-muted-foreground group-has-checked:text-subtle">
                  <span
                    title={t("difficulty.pegs", { pegs })}
                    className="inline-flex items-center gap-1"
                  >
                    <Circle aria-hidden className="size-2.5 fill-current" />
                    <span aria-hidden>{pegs}</span>
                    <span className="sr-only">
                      {t("difficulty.pegs", { pegs })}
                    </span>
                  </span>
                  <span
                    title={t("difficulty.colors", { colors })}
                    className="inline-flex items-center gap-1"
                  >
                    <Palette
                      aria-hidden
                      className={`size-4 ${COLOURFUL_PALETTE_CLASS}`}
                    />
                    <span aria-hidden>{colors}</span>
                    <span className="sr-only">
                      {t("difficulty.colors", { colors })}
                    </span>
                  </span>
                </span>
                <span className="block text-xs font-normal text-muted-foreground group-has-checked:text-subtle">
                  {allowRepeats
                    ? t("difficulty.repeats")
                    : t("difficulty.noRepeats")}
                </span>
              </>
            )}
          </label>
        );
      })}
    </fieldset>
  );
}
