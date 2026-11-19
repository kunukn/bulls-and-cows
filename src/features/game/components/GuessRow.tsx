import type { Color } from "@/features/game/logic";
import type { Guess } from "@/features/game/machine";
import { cn } from "@/utils/cn";
import { X } from "lucide-react";
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
        isActive && "bg-board-active shadow-board-glow ring-2 ring-board-ring",
      )}
    >
      <span
        className={cn(
          NUMBER_COLUMN,
          "text-right text-xs text-board-label tabular-nums",
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
              className="group relative cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
            >
              <Peg
                color={color}
                className="transition-opacity group-hover:opacity-70"
              />
              {/* Touch has no hover, so the badge is always shown there. */}
              <span
                aria-hidden
                className="absolute -end-1 -top-1 grid size-4 place-items-center rounded-full bg-slate-900 text-slate-200 opacity-0 ring-1 ring-slate-500 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 pointer-coarse:opacity-100"
              >
                <X className="size-3" strokeWidth={3} />
              </span>
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
