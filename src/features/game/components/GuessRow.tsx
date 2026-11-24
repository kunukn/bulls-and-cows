import type { Color } from "@/features/game/logic";
import type { Guess } from "@/features/game/machine";
import { cn } from "@/utils/cn";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FeedbackPegs, feedbackRevealMs } from "./FeedbackPegs";
import { Peg, pickInsertAnimation } from "./Peg";

const SHIMMER_STAGGER_MS = 80;
import { NUMBER_COLUMN, PEGS_COLUMN, ROW_LAYOUT } from "./rowLayout";

type Props = {
  rowNumber: number;
  pegs: (Color | null)[];
  guess?: Guess;
  isActive?: boolean;
  /* The latest scored row: its feedback pegs pop in. */
  isJustScored?: boolean;
  /* The row that cracked the code: its pegs shimmer once feedback is in. */
  isWinning?: boolean;
  /* Active row: the slot the next colour goes into, null when full. */
  target?: number | null;
  onSelectSlot?: (index: number) => void;
  onClearSlot?: (index: number) => void;
  ref?: React.Ref<HTMLLIElement>;
};

export function GuessRow({
  rowNumber,
  pegs,
  guess,
  isActive = false,
  isJustScored = false,
  isWinning = false,
  target = null,
  onSelectSlot,
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
        // scroll-mb: the gap Board keeps between the active row and the sticky palette.
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
      <div
        className={cn(
          PEGS_COLUMN,
          // Per-theme: Candy's opaque holes recede by tint, not fade (0007).
          isUpcoming &&
            "opacity-(--board-upcoming-opacity) [--board-hole:var(--board-hole-upcoming)]",
        )}
      >
        {pegs.map((color, index) =>
          isActive && onSelectSlot ? (
            <span key={index} className="group relative">
              <button
                type="button"
                onClick={() => onSelectSlot(index)}
                aria-pressed={index === target}
                aria-label={
                  color
                    ? t("game.slotReplace", {
                        slot: index + 1,
                        color: t(`colors.${color}`),
                      })
                    : t("game.slotEmpty", { slot: index + 1 })
                }
                className={cn(
                  "block cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400",
                  // The target hole catches the light: the next colour goes here.
                  index === target &&
                    "shadow-board-glow ring-2 ring-board-ring",
                )}
              >
                {/* Keyed by colour so a replaced peg plays its insert again. */}
                <Peg
                  key={color ?? "empty"}
                  color={color}
                  className={cn(
                    color && pickInsertAnimation(rowNumber, index, color),
                  )}
                />
              </button>
              {color && onClearSlot && (
                <button
                  type="button"
                  onClick={() => onClearSlot(index)}
                  aria-label={t("game.slotClear", {
                    slot: index + 1,
                    color: t(`colors.${color}`),
                  })}
                  // Touch has no hover, so the badge is always shown there.
                  className="absolute -end-1 -top-1 grid size-4 cursor-pointer place-items-center rounded-full bg-slate-900 text-slate-200 opacity-0 ring-1 ring-slate-500 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-sky-400 pointer-coarse:opacity-100"
                >
                  <X className="size-3" strokeWidth={3} />
                </button>
              )}
            </span>
          ) : (
            <Peg
              key={index}
              color={color}
              className={cn(isWinning && "motion-safe:animate-peg-shimmer")}
              style={
                isWinning
                  ? {
                      // Starts after the feedback pegs have popped in.
                      animationDelay: `${feedbackRevealMs(pegs.length) + index * SHIMMER_STAGGER_MS}ms`,
                    }
                  : undefined
              }
            />
          ),
        )}
      </div>
      <FeedbackPegs
        black={guess?.black}
        white={guess?.white}
        pegs={pegs.length}
        isScored={Boolean(guess)}
        isAnimated={isJustScored}
        className={cn("justify-items-center", isUpcoming && "opacity-60")}
      />
    </li>
  );
}
