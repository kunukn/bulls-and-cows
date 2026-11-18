import type { Color } from "@/features/game/logic";
import type { Guess } from "@/features/game/machine";
import { cn } from "@/utils/cn";
import { FeedbackPegs } from "./FeedbackPegs";
import { Peg } from "./Peg";

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
  return (
    <li
      ref={ref}
      aria-current={isActive ? "step" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-2 py-1",
        isActive && "bg-amber-700/60 ring-2 ring-amber-300/70",
      )}
    >
      <span className="w-5 text-right text-xs text-amber-200/70 tabular-nums">
        {rowNumber}
      </span>
      <div className="flex flex-1 justify-center gap-2">
        {pegs.map((color, index) =>
          isActive && color && onClearSlot ? (
            <button
              key={index}
              type="button"
              onClick={() => onClearSlot(index)}
              aria-label={`Slot ${index + 1}: ${color}. Clear`}
              className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
            >
              <Peg color={color} />
            </button>
          ) : (
            <Peg key={index} color={color} />
          ),
        )}
      </div>
      {guess ? (
        <FeedbackPegs
          black={guess.black}
          white={guess.white}
          pegs={pegs.length}
        />
      ) : (
        <div aria-hidden className="w-10 shrink-0" />
      )}
    </li>
  );
}
