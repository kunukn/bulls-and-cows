import type { Feedback } from "@/features/game/logic";
import { cn } from "@/utils/cn";
import { useTranslation } from "react-i18next";
import { FEEDBACK_COLUMN } from "./rowLayout";

/*
 * Scored pegs are full size, empty slots a small dot: size, not colour, tells
 * a black bull from an empty hole on every board theme. The bull gets a light
 * rim and a highlight so it reads as a raised peg even on near-black boards.
 * Shared with the legend in Play.
 */
export const BULL_PEG_CLASS =
  "bg-[radial-gradient(circle_at_35%_30%,var(--color-zinc-500),var(--color-zinc-950)_65%)] ring-1 ring-zinc-300";
export const COW_PEG_CLASS = "bg-white";

type Props = Partial<Feedback> & {
  pegs: number;
  /* False for rows not yet guessed: draw empty holes, announce nothing. */
  isScored?: boolean;
  /* Pop scored pegs in one after another (bulls first, then cows). */
  isAnimated?: boolean;
  className?: string;
};

export const FEEDBACK_STAGGER_MS = 70;
export const FEEDBACK_POP_MS = 160;

/* Time until every feedback peg of a row has popped in. */
export function feedbackRevealMs(pegs: number): number {
  return (pegs - 1) * FEEDBACK_STAGGER_MS + FEEDBACK_POP_MS;
}

/* Bulls (black) first, then cows (white), then empty holes. */
export function FeedbackPegs({
  black = 0,
  white = 0,
  pegs,
  isScored = true,
  isAnimated = false,
  className,
}: Props) {
  const { t } = useTranslation();
  const marks = Array.from({ length: pegs }, (_, index) => {
    if (index < black) return "black";

    return index < black + white ? "white" : "empty";
  });
  const label =
    black + white === 0 && pegs > 0
      ? t("game.noMatches")
      : t("game.feedback", {
          bulls: t("game.bulls", { count: black }),
          cows: t("game.cows", { count: white }),
        });

  return (
    <div
      className={cn(
        FEEDBACK_COLUMN,
        "grid gap-1",
        pegs > 4 ? "grid-cols-3" : "grid-cols-2",
        className,
      )}
    >
      {isScored && <span className="sr-only">{label}</span>}
      {marks.map((mark, index) => (
        // Fixed-size slot, so small empty dots keep the grid aligned.
        <span
          key={index}
          aria-hidden
          className="grid size-3 place-items-center"
        >
          <span
            className={cn(
              "rounded-full",
              mark === "black" && cn("size-3", BULL_PEG_CLASS),
              mark === "white" && cn("size-3", COW_PEG_CLASS),
              mark === "empty" && "size-1.5 bg-board-label opacity-40",
              isAnimated &&
                mark !== "empty" &&
                "motion-safe:animate-feedback-pop",
            )}
            style={
              isAnimated && mark !== "empty"
                ? { animationDelay: `${index * FEEDBACK_STAGGER_MS}ms` }
                : undefined
            }
          />
        </span>
      ))}
    </div>
  );
}
