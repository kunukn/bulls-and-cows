import { DIFFICULTIES } from "@/features/game/logic";
import {
  useGameActorRef,
  useGameSelector,
} from "@/features/game/machine-context";
import { useEffect, useRef } from "react";
import { cn } from "@/utils/cn";
import { GuessRow } from "./GuessRow";
import {
  FEEDBACK_COLUMN,
  NUMBER_COLUMN,
  PEG_SIZE,
  PEGS_COLUMN,
  ROW_LAYOUT,
} from "./rowLayout";
import { Peg } from "./Peg";

export function Board() {
  const actor = useGameActorRef();
  const { difficulty, guesses, current, secret } = useGameSelector(
    (snapshot) => snapshot.context,
  );
  const isPlaying = useGameSelector((snapshot) => snapshot.matches("playing"));
  const { maxGuesses, pegs } = DIFFICULTIES[difficulty];
  const activeRowRef = useRef<HTMLLIElement>(null);

  /* Keep the active row visible on small screens as the board grows. */
  useEffect(() => {
    activeRowRef.current?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [guesses.length]);

  return (
    <section
      aria-label="Board"
      className="rounded-2xl bg-amber-800 p-3 shadow-lg shadow-black/40"
    >
      <div
        aria-label={isPlaying ? "Secret code (hidden)" : "Secret code"}
        className={cn(ROW_LAYOUT, "mb-3 rounded-lg bg-amber-950/50 py-2")}
      >
        <span aria-hidden className={NUMBER_COLUMN} />
        <div className={PEGS_COLUMN}>
          {isPlaying
            ? Array.from({ length: pegs }, (_, index) => (
                <span
                  key={index}
                  aria-hidden
                  className={cn(
                    PEG_SIZE,
                    "grid place-items-center rounded-full bg-slate-700 text-sm font-bold text-slate-400",
                  )}
                >
                  ?
                </span>
              ))
            : secret.map((color, index) => (
                <span key={index} className="contents">
                  <Peg color={color} />
                  <span className="sr-only">{color}</span>
                </span>
              ))}
        </div>
        <span aria-hidden className={FEEDBACK_COLUMN} />
      </div>
      <ol className="flex flex-col gap-1">
        {Array.from({ length: maxGuesses }, (_, index) => {
          const guess = guesses[index];
          const isActive = isPlaying && index === guesses.length;

          return (
            <GuessRow
              key={index}
              ref={isActive ? activeRowRef : undefined}
              rowNumber={index + 1}
              pegs={
                guess?.pegs ?? (isActive ? current : Array(pegs).fill(null))
              }
              guess={guess}
              isActive={isActive}
              onClearSlot={(slot) =>
                actor.send({ type: "CLEAR_SLOT", index: slot })
              }
            />
          );
        })}
      </ol>
    </section>
  );
}
