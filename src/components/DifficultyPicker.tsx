import {
  DIFFICULTIES,
  DIFFICULTY_KEYS,
  type Difficulty,
} from "@/features/game/logic";
import { useSettings } from "@/features/game/store/settings";
import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";

type Props = {
  value: Difficulty;
  onChange: (difficulty: Difficulty) => void;
  name: string;
  legend: string;
};

/* Native radio group styled as a segmented control — arrow-key navigation for free. */
export function DifficultyPicker({ value, onChange, name, legend }: Props) {
  const { t } = useTranslation();
  const isMinimalText = useSettings((state) => state.isMinimalText);

  return (
    <fieldset className="flex rounded-lg bg-card p-1">
      <legend className="sr-only">{legend}</legend>
      {DIFFICULTY_KEYS.map((key, index) => {
        const { pegs, colors } = DIFFICULTIES[key];

        return (
          <label
            key={key}
            className="flex-1 cursor-pointer rounded-md px-2 py-1.5 text-center text-sm font-medium text-subtle transition-colors has-checked:bg-control has-checked:text-foreground has-focus-visible:outline-2 has-focus-visible:outline-ring"
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
                <span className="block text-xs font-normal text-muted-foreground">
                  {t("difficulty.details", { pegs, colors })}
                </span>
              </>
            )}
          </label>
        );
      })}
    </fieldset>
  );
}
