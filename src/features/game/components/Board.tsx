import { DIFFICULTIES } from "@/features/game/logic";
import {
  useGameActorRef,
  useGameSelector,
} from "@/features/game/machine-context";
import { useSettings } from "@/features/game/store/settings";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const actor = useGameActorRef();
  const { difficulty, guesses, current, secret } = useGameSelector(
    (snapshot) => snapshot.context,
  );
  const isPlaying = useGameSelector((snapshot) => snapshot.matches("playing"));
  const { maxGuesses, pegs } = DIFFICULTIES[difficulty];
  const activeRowRef = useRef<HTMLLIElement>(null);
  const boardTheme = useSettings((state) => state.boardTheme);

  /* Keep the active row visible on small screens as the board grows. */
  useEffect(() => {
    activeRowRef.current?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [guesses.length]);

  return (
    <section
      aria-label={t("game.board")}
      data-board-theme={boardTheme}
      className="rounded-2xl p-3 shadow-lg shadow-black/40 board-surface"
    >
      <div
        aria-label={isPlaying ? t("game.secretHidden") : t("game.secret")}
        className={cn(ROW_LAYOUT, "mb-3 rounded-lg bg-board-tray py-2")}
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
                    "grid place-items-center rounded-full bg-slate-700 text-sm font-bold text-slate-400 shadow-[inset_0_-2px_3px_rgb(0_0_0/0.25)]",
                  )}
                >
                  ?
                </span>
              ))
            : secret.map((color, index) => (
                <span key={index} className="contents">
                  <Peg color={color} />
                  <span className="sr-only">{t(`colors.${color}`)}</span>
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
              isJustScored={index === guesses.length - 1}
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
