import { paletteFor } from "@/features/game/logic";
import {
  useGameActorRef,
  useGameSelector,
} from "@/features/game/machine-context";
import { cn } from "@/utils/cn";
import { CornerDownLeft, Delete } from "lucide-react";
import { PEG_CLASS } from "./Peg";

const actionButtonClass =
  "flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 disabled:cursor-not-allowed disabled:opacity-40";

export function Palette() {
  const actor = useGameActorRef();
  const difficulty = useGameSelector((snapshot) => snapshot.context.difficulty);
  const current = useGameSelector((snapshot) => snapshot.context.current);
  const isRowFull = !current.includes(null);
  const isRowEmpty = current.every((peg) => peg === null);
  const palette = paletteFor(difficulty);

  return (
    <section aria-label="Colour palette" className="flex flex-col gap-3">
      {/*
       * One row, one column per colour: each is at most 2.75rem (44px tap
       * target) and shrinks only when space runs out, so hard's 8 colours fit
       * a 320px phone without wrapping.
       */}
      <div
        style={{ "--colors": palette.length } as React.CSSProperties}
        className="grid grid-cols-[repeat(var(--colors),minmax(0,2.75rem))] justify-center gap-2 max-sm:gap-1.5"
      >
        {palette.map((color, index) => (
          <button
            key={color}
            type="button"
            disabled={isRowFull}
            onClick={() => actor.send({ type: "ADD_PEG", color })}
            aria-label={`Add ${color} (key ${index + 1})`}
            className={cn(
              PEG_CLASS[color],
              "relative grid aspect-square w-full place-items-center rounded-full shadow-[inset_0_-3px_4px_rgb(0_0_0/0.35)] transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            <span aria-hidden className="text-xs font-bold text-black/50">
              {index + 1}
            </span>
          </button>
        ))}
      </div>
      <div className="flex justify-center gap-2">
        <button
          type="button"
          disabled={isRowEmpty}
          onClick={() => actor.send({ type: "REMOVE_PEG" })}
          className={cn(actionButtonClass, "bg-slate-700 hover:bg-slate-600")}
        >
          <Delete className="size-4" />
          Undo
        </button>
        <button
          type="button"
          disabled={!isRowFull}
          onClick={() => actor.send({ type: "SUBMIT" })}
          className={cn(
            actionButtonClass,
            "bg-emerald-600 text-white hover:bg-emerald-500",
          )}
        >
          Check
          <CornerDownLeft className="size-4" />
        </button>
      </div>
    </section>
  );
}
