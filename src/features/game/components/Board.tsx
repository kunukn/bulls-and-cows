import { DIFFICULTIES } from "@/features/game/logic";
import {
  useGameActorRef,
  useGameSelector,
} from "@/features/game/machine-context";
import { useSettings } from "@/features/game/store/settings";
import { useGameSounds } from "@/features/game/useGameSounds";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/cn";
import { GuessRow } from "./GuessRow";
import {
  FEEDBACK_COLUMN,
  NUMBER_COLUMN,
  PEGS_COLUMN,
  ROW_LAYOUT,
} from "./rowLayout";
import { Peg } from "./Peg";
import { SecretShield } from "./SecretShield";

/* Symmetric, so it needs no RTL counterpart. */
const ROW_SHAKE_KEYFRAMES: Keyframe[] = [
  { transform: "translateX(0)" },
  { transform: "translateX(-5px)" },
  { transform: "translateX(5px)" },
  { transform: "translateX(-3px)" },
  { transform: "translateX(2px)" },
  { transform: "translateX(0)" },
];

export function Board() {
  const { t } = useTranslation();
  const actor = useGameActorRef();
  useGameSounds();
  const { difficulty, guesses, current, secret } = useGameSelector(
    (snapshot) => snapshot.context,
  );
  const isPlaying = useGameSelector((snapshot) => snapshot.matches("playing"));
  const isWon = useGameSelector((snapshot) => snapshot.matches("won"));
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

  /*
   * Rejected submit (Enter on an unfinished row): shake the active row. The
   * Web Animations API restarts on every call, which a CSS class can't do
   * without a remove/reflow/add dance.
   */
  useEffect(() => {
    const subscription = actor.on("rowIncomplete", () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      activeRowRef.current?.animate(ROW_SHAKE_KEYFRAMES, {
        duration: 280,
        easing: "ease-out",
      });
    });

    return () => subscription.unsubscribe();
  }, [actor]);

  return (
    <section
      aria-label={t("game.board")}
      data-board-theme={boardTheme}
      className="rounded-2xl p-3 shadow-lg shadow-black/40 board-surface"
    >
      <div
        aria-label={isPlaying ? t("game.secretHidden") : t("game.secret")}
        className={cn(
          ROW_LAYOUT,
          "relative mb-3 rounded-lg bg-board-tray py-2",
        )}
      >
        <span aria-hidden className={NUMBER_COLUMN} />
        <div className={PEGS_COLUMN}>
          {/* Empty holes while playing, so the code never reaches the DOM. */}
          {isPlaying
            ? Array.from({ length: pegs }, (_, index) => (
                <Peg key={index} color={null} />
              ))
            : secret.map((color, index) => (
                <span key={index} className="contents">
                  <Peg color={color} />
                  <span className="sr-only">{t(`colors.${color}`)}</span>
                </span>
              ))}
        </div>
        <span aria-hidden className={FEEDBACK_COLUMN} />
        <SecretShield pegs={pegs} isOpen={!isPlaying} />
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
              isWinning={isWon && index === guesses.length - 1}
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
