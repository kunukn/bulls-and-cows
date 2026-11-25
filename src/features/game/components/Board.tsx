import { DIFFICULTIES } from "@/features/game/logic";
import {
  useGameActorRef,
  useGameSelector,
} from "@/features/game/machine-context";
import { useSettings } from "@/features/game/store/settings";
import { useGameSounds } from "@/features/game/useGameSounds";
import { useHasNewHint } from "@/features/game/useHasNewHint";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/cn";
import { GuessRow } from "./GuessRow";
import { SecretTray } from "./SecretTray";
import { useActiveRow } from "./useActiveRow";

// Without repeats (Easy), the start hint is where the player learns the rule.
const START_HINT_KEYS = {
  repeats: { manual: "game.startHint", auto: "game.startHintAuto" },
  distinct: {
    manual: "game.startHintDistinct",
    auto: "game.startHintDistinctAuto",
  },
} as const;

export function Board() {
  const { t } = useTranslation();
  const actor = useGameActorRef();
  useGameSounds();
  const { difficulty, guesses, current, secret, target, dailyNumber } =
    useGameSelector((snapshot) => snapshot.context);
  const isPlaying = useGameSelector((snapshot) => snapshot.matches("playing"));
  const isWon = useGameSelector((snapshot) => snapshot.matches("won"));
  const { maxGuesses, pegs, allowRepeats } = DIFFICULTIES[difficulty];
  const activeRowRef = useActiveRow(guesses.length);
  const boardTheme = useSettings((state) => state.boardTheme);
  const isHintsEnabled = useSettings((state) => state.isHintsEnabled);
  const isAutoSubmit = useSettings((state) => state.isAutoSubmit);
  // Until the first guess is scored, say what to do: nothing else on the board does.
  const hasStartHint = isPlaying && guesses.length === 0;
  const startHintKey =
    START_HINT_KEYS[allowRepeats ? "repeats" : "distinct"][
      isAutoSubmit ? "auto" : "manual"
    ];
  const hasShieldBull = isPlaying && isHintsEnabled;
  // The daily bull never reads the clues (0012), so it has no news to flag.
  const isDaily = dailyNumber !== null;
  const hasNewHint = useHasNewHint(hasShieldBull && !isDaily);

  return (
    <section
      aria-label={t("game.board")}
      data-board-theme={boardTheme}
      className="rounded-2xl p-3 shadow-lg shadow-board-drop board-surface"
    >
      <SecretTray
        pegs={pegs}
        secret={secret}
        isPlaying={isPlaying}
        hasShieldBull={hasShieldBull}
        hasNewHint={hasNewHint}
        isDaily={isDaily}
      />
      {/* Always rendered, hidden after the first guess, so the rows don't shift up. */}
      <p
        className={cn(
          "mb-2 text-center text-xs leading-none text-board-label",
          !hasStartHint && "invisible",
        )}
      >
        {t(startHintKey, { count: pegs })}
      </p>
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
