import { BullBubble } from "@/components/layout/BullBubble";
import { newsworthyHintKeys } from "@/features/game/hints";
import { DIFFICULTIES } from "@/features/game/logic";
import {
  useGameActorRef,
  useGameSelector,
} from "@/features/game/machine-context";
import { useHintsSeen } from "@/features/game/store/hintsSeen";
import { useSettings } from "@/features/game/store/settings";
import { useGameSounds } from "@/features/game/useGameSounds";
import { useEffect, useMemo, useRef } from "react";
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

/* Stable, so the seen-hints selector doesn't hand back a new array each call. */
const NOTHING_SEEN: readonly string[] = [];

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
  const target = useGameSelector((snapshot) => snapshot.context.target);
  const isWon = useGameSelector((snapshot) => snapshot.matches("won"));
  const { maxGuesses, pegs } = DIFFICULTIES[difficulty];
  const activeRowRef = useRef<HTMLLIElement>(null);
  const boardTheme = useSettings((state) => state.boardTheme);
  const isHintsEnabled = useSettings((state) => state.isHintsEnabled);
  const isAutoSubmit = useSettings((state) => state.isAutoSubmit);
  // Until the first guess is scored, say what to do: nothing else on the board does.
  const hasStartHint = isPlaying && guesses.length === 0;
  const startedAt = useGameSelector((snapshot) => snapshot.context.startedAt);
  const hasShieldBull = isPlaying && isHintsEnabled;
  // Deducing takes up to ~20 ms on Hard; redo it only when a guess is scored.
  const hintKeys = useMemo(
    () => (hasShieldBull ? newsworthyHintKeys(difficulty, guesses) : []),
    [hasShieldBull, difficulty, guesses],
  );
  const seen = useHintsSeen((state) =>
    state.gameId === startedAt ? state.keys : NOTHING_SEEN,
  );
  const hasNewHint = hintKeys.some((key) => !seen.includes(key));

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
      className="rounded-2xl p-3 shadow-lg shadow-board-drop board-surface"
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
        {/* Above the shield (z-10), so the moulded bull it covers is clickable. */}
        <span className={cn(FEEDBACK_COLUMN, "relative z-10 self-stretch")}>
          {hasShieldBull && (
            <BullBubble variant="shield" hasNewHint={hasNewHint} />
          )}
        </span>
        <SecretShield
          pegs={pegs}
          isOpen={!isPlaying}
          hasBull={hasShieldBull}
          hasNewHint={hasNewHint}
        />
      </div>
      {hasStartHint && (
        <p className="mb-2 text-center text-xs text-board-label">
          {isAutoSubmit
            ? t("game.startHintAuto", { count: pegs })
            : t("game.startHint", { count: pegs })}
        </p>
      )}
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
              target={target}
              onSelectSlot={(slot) =>
                actor.send({ type: "SELECT_SLOT", index: slot })
              }
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
