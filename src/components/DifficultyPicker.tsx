import {
  DIFFICULTIES,
  DIFFICULTY_KEYS,
  type Difficulty,
} from "@/features/game/logic";
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

  return (
    <fieldset className="flex rounded-lg bg-slate-800 p-1">
      <legend className="sr-only">{legend}</legend>
      {DIFFICULTY_KEYS.map((key) => {
        const { pegs, colors } = DIFFICULTIES[key];

        return (
          <label
            key={key}
            className="flex-1 cursor-pointer rounded-md px-2 py-1.5 text-center text-sm font-medium text-slate-300 transition-colors has-checked:bg-slate-600 has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-sky-400"
          >
            <input
              type="radio"
              name={name}
              value={key}
              checked={value === key}
              onChange={() => onChange(key)}
              className="sr-only"
            />
            {t(`difficulty.${key}`)}
            <span className="block text-xs font-normal text-slate-400">
              {t("difficulty.details", { pegs, colors })}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
