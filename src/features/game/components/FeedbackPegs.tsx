import type { Feedback } from "@/features/game/logic";
import { useSettings } from "@/features/game/store/settings";
import { cn } from "@/utils/cn";
import { useTranslation } from "react-i18next";
import { FEEDBACK_COLUMN } from "./rowLayout";

/*
 * Scored pegs are full size, empty slots a small dot: size, not colour, tells
 * a black bull from an empty hole on every board theme. The bull gets a light
 * rim and a highlight so it reads as a raised peg even on near-black boards.
 * The cow is lit from the same spot but stays light to its edge (zinc-300):
 * bulls and cows are told apart by light vs dark (0004).
 * Shared with the legend in Play, which keeps the bulls' own rims; on the
 * board key pegs take the board's --board-bull-ring / --board-key-ring
 * instead (0007).
 */
const BLACK_BULL_PEG_CLASS =
  "bg-[radial-gradient(circle_at_35%_30%,var(--color-zinc-500),var(--color-zinc-950)_65%)] ring-1 ring-zinc-300";
const PINK_BULL_PEG_CLASS =
  "bg-[radial-gradient(circle_at_35%_30%,var(--color-pink-300),var(--color-pink-600)_65%)] ring-1 ring-pink-200";
export const COW_PEG_CLASS =
  "bg-[radial-gradient(circle_at_35%_30%,var(--color-white),var(--color-zinc-300)_70%)]";

/* The "Pink bulls" setting swaps the black bull for a pink one. */
export function useBullPegClass(): string {
  const isPinkBull = useSettings((state) => state.isPinkBull);

  return isPinkBull ? PINK_BULL_PEG_CLASS : BLACK_BULL_PEG_CLASS;
}
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
  const bullPegClass = useBullPegClass();
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
          className="grid size-3 place-items-center desk:size-3.5 big:size-4"
        >
          <span
            className={cn(
              "rounded-full",
              mark === "black" && bullPegClass,
              mark === "white" && COW_PEG_CLASS,
              // After the peg class, so cn() lets this ring colour win.
              mark !== "empty" && "size-3 ring-1 desk:size-3.5 big:size-4",
              mark === "black" && "ring-board-bull-ring",
              mark === "white" && "ring-board-key-ring",
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
