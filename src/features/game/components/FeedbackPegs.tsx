import type { Feedback } from "@/features/game/logic";
import { cn } from "@/utils/cn";
import { FEEDBACK_COLUMN } from "./rowLayout";

type Props = Partial<Feedback> & { pegs: number };

/* Bulls (black) first, then cows (white), then empty holes. */
export function FeedbackPegs({ black = 0, white = 0, pegs }: Props) {
  const marks = Array.from({ length: pegs }, (_, index) => {
    if (index < black) return "black";

    return index < black + white ? "white" : "empty";
  });
  const label =
    black + white === 0 && pegs > 0
      ? "No matches"
      : `${black} bull${black === 1 ? "" : "s"}, ${white} cow${white === 1 ? "" : "s"}`;

  return (
    <div
      className={cn(
        FEEDBACK_COLUMN,
        "grid gap-1",
        pegs > 4 ? "grid-cols-3" : "grid-cols-2",
      )}
    >
      <span className="sr-only">{label}</span>
      {marks.map((mark, index) => (
        <span
          key={index}
          aria-hidden
          className={cn(
            "size-3 rounded-full",
            mark === "black" && "bg-zinc-950 ring-1 ring-zinc-400",
            mark === "white" && "bg-white",
            mark === "empty" && "bg-amber-950/60",
          )}
        />
      ))}
    </div>
  );
}
