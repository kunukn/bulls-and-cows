import type { Feedback } from "@/features/game/logic";
import { cn } from "@/utils/cn";
import { useTranslation } from "react-i18next";
import { FEEDBACK_COLUMN } from "./rowLayout";

type Props = Partial<Feedback> & {
  pegs: number;
  /* False for rows not yet guessed: draw empty holes, announce nothing. */
  isScored?: boolean;
  className?: string;
};

/* Bulls (black) first, then cows (white), then empty holes. */
export function FeedbackPegs({
  black = 0,
  white = 0,
  pegs,
  isScored = true,
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
        <span
          key={index}
          aria-hidden
          className={cn(
            "size-3 rounded-full",
            mark === "black" && "bg-zinc-950 ring-1 ring-zinc-400",
            mark === "white" && "bg-white",
            mark === "empty" &&
              "bg-amber-950/60 shadow-[inset_0_1px_2px_rgb(0_0_0/0.5)]",
          )}
        />
      ))}
    </div>
  );
}
