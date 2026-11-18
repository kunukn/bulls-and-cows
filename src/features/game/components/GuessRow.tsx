import type { Color } from "@/features/game/logic";
import type { Guess } from "@/features/game/machine";
import { cn } from "@/utils/cn";
import { useTranslation } from "react-i18next";
import { FeedbackPegs } from "./FeedbackPegs";
import { Peg } from "./Peg";
import { NUMBER_COLUMN, PEGS_COLUMN, ROW_LAYOUT } from "./rowLayout";

type Props = {
  rowNumber: number;
  pegs: (Color | null)[];
  guess?: Guess;
  isActive?: boolean;
  onClearSlot?: (index: number) => void;
  ref?: React.Ref<HTMLLIElement>;
};

export function GuessRow({
  rowNumber,
  pegs,
  guess,
  isActive = false,
  onClearSlot,
  ref,
}: Props) {
  const { t } = useTranslation();
  // Rows not reached yet: holes stay visible but recede behind the play area.
  const isUpcoming = !guess && !isActive;

  return (
    <li
      ref={ref}
      aria-current={isActive ? "step" : undefined}
      className={cn(
        // scroll-mb keeps the active row clear of the sticky palette on scrollIntoView.
        ROW_LAYOUT,
        "scroll-mb-40 rounded-lg py-1",
        isActive && "bg-amber-700/60 ring-2 ring-amber-300/70",
      )}
    >
      <span
        className={cn(
          NUMBER_COLUMN,
          "text-right text-xs text-amber-200/70 tabular-nums",
        )}
      >
        {rowNumber}
      </span>
      <div className={cn(PEGS_COLUMN, isUpcoming && "opacity-60")}>
        {pegs.map((color, index) =>
          isActive && color && onClearSlot ? (
            <button
              key={index}
              type="button"
              onClick={() => onClearSlot(index)}
              aria-label={t("game.slotClear", {
                slot: index + 1,
                color: t(`colors.${color}`),
              })}
              className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
            >
              <Peg color={color} />
            </button>
          ) : (
            <Peg key={index} color={color} />
          ),
        )}
      </div>
      <FeedbackPegs
        black={guess?.black}
        white={guess?.white}
        pegs={pegs.length}
        isScored={Boolean(guess)}
        className={cn(isUpcoming && "opacity-60")}
      />
    </li>
  );
}
