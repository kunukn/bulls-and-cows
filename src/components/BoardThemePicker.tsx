import { BOARD_THEMES, type BoardTheme } from "@/features/game/boardThemes";
import { useTranslation } from "react-i18next";

type Props = {
  value: BoardTheme;
  onChange: (boardTheme: BoardTheme) => void;
  name: string;
  legend: string;
};

/* Native radio group of swatches; each swatch renders with its own theme tokens. */
export function BoardThemePicker({ value, onChange, name, legend }: Props) {
  const { t } = useTranslation();

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 font-medium">{legend}</legend>
      <div className="grid grid-cols-2 gap-2">
        {BOARD_THEMES.map((theme) => (
          <label
            key={theme}
            className="flex cursor-pointer flex-col gap-1.5 rounded-lg p-1.5 text-center text-sm text-subtle ring-1 ring-border transition-colors has-checked:bg-secondary has-checked:text-foreground has-checked:ring-2 has-checked:ring-subtle has-focus-visible:outline-2 has-focus-visible:outline-ring"
          >
            <input
              type="radio"
              name={name}
              value={theme}
              checked={value === theme}
              onChange={() => onChange(theme)}
              className="sr-only"
            />
            <span
              aria-hidden
              data-board-theme={theme}
              className="flex h-10 items-center justify-center gap-1.5 rounded-md board-surface"
            >
              <span className="size-4 rounded-full bg-peg-red" />
              <span className="size-4 rounded-full bg-board-hole shadow-[inset_0_1px_2px_var(--board-hole-shade)] ring-1 ring-board-hole-ring" />
              <span className="size-4 rounded-full bg-board-hole shadow-[inset_0_1px_2px_var(--board-hole-shade)] ring-1 ring-board-hole-ring" />
            </span>
            {t(`common.boardThemes.${theme}`)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
