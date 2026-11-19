import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DifficultyPicker } from "@/components/DifficultyPicker";
import { paletteFor, type Difficulty } from "@/features/game/logic";
import {
  useGameActorRef,
  useGameSelector,
} from "@/features/game/machine-context";
import { useSettings } from "@/features/game/store/settings";
import { cn } from "@/utils/cn";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Board } from "../components/Board";
import { BULL_PEG_CLASS, COW_PEG_CLASS } from "../components/FeedbackPegs";
import { GiveUpButton } from "../components/GiveUpButton";
import { Palette } from "../components/Palette";
import { ResultPanel } from "../components/ResultPanel";
import { Timer } from "../components/Timer";

export function Play() {
  const { t } = useTranslation();
  const actor = useGameActorRef();
  const difficulty = useGameSelector((snapshot) => snapshot.context.difficulty);
  const isPlaying = useGameSelector((snapshot) => snapshot.matches("playing"));
  const hasProgress = useGameSelector(
    (snapshot) => snapshot.context.startedAt > 0,
  );
  const setDifficulty = useSettings((state) => state.setDifficulty);
  const isTimerVisible = useSettings((state) => state.isTimerVisible);
  const isMinimalText = useSettings((state) => state.isMinimalText);
  // Hidden only while playing; the final time shows once the game ends.
  const isTimerShown = isTimerVisible || !isPlaying;
  // Difficulty waiting on the abandon dialog; null while it is closed.
  const [pendingDifficulty, setPendingDifficulty] = useState<Difficulty | null>(
    null,
  );

  function startGame(next: Difficulty) {
    setDifficulty(next);
    actor.send({ type: "NEW_GAME", difficulty: next });
  }

  function changeDifficulty(next: Difficulty) {
    if (isPlaying && hasProgress) {
      setPendingDifficulty(next);

      return;
    }

    startGame(next);
  }

  /* Keys 1–8 add a colour, Backspace undoes, Enter checks the row. */
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!isPlaying || event.metaKey || event.ctrlKey || event.altKey) return;

      const target =
        event.target instanceof Element ? event.target : document.body;
      // Leave typing fields alone; the difficulty radios keep shortcuts working.
      if (target.closest("input:not([type=radio]), textarea, select")) return;

      // An open dialog (Settings drawer, confirm dialog) owns the keyboard.
      if (target.closest("[role=dialog], [role=alertdialog]")) return;

      const palette = paletteFor(difficulty);
      const digit = Number(event.key);

      if (digit >= 1 && digit <= palette.length) {
        actor.send({
          type: "ADD_PEG",
          color: palette[digit - 1],
          isAutoSubmit: useSettings.getState().isAutoSubmit,
        });
      } else if (event.key === "Backspace") {
        event.preventDefault();
        actor.send({ type: "REMOVE_PEG" });
      } else if (event.key === "Enter" && !target.closest("button")) {
        /*
         * A focused button already handles Enter natively. preventDefault stops
         * this Enter from also submitting the name form that autofocuses on a win.
         */
        event.preventDefault();
        actor.send({ type: "SUBMIT" });
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [actor, difficulty, isPlaying]);

  return (
    <div className="flex flex-col gap-4">
      <DifficultyPicker
        name="difficulty"
        legend={t("difficulty.legend")}
        value={difficulty}
        onChange={changeDifficulty}
      />
      <ConfirmDialog
        isOpen={pendingDifficulty !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setPendingDifficulty(null);
        }}
        title={t("game.abandonConfirm")}
        description={t("game.abandonDescription")}
        confirmLabel={t("game.abandon")}
        onConfirm={() => pendingDifficulty && startGame(pendingDifficulty)}
      />
      {/* Minimal text drops the legend; the help popover still explains pegs. */}
      {(!isMinimalText || isTimerShown || isPlaying) && (
        <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
          {!isMinimalText && (
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="flex items-center gap-1.5">
                <span className={cn("size-2.5 rounded-full", BULL_PEG_CLASS)} />
                {t("game.legendBull")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className={cn("size-2.5 rounded-full", COW_PEG_CLASS)} />
                {t("game.legendCow")}
              </span>
            </span>
          )}
          <span className="ms-auto flex items-center gap-3">
            {isPlaying && <GiveUpButton />}
            {isTimerShown && <Timer />}
          </span>
        </div>
      )}
      <Board />
      {/* Sticky: on short viewports the board scrolls under the controls. */}
      <div className="dock sticky bottom-0 -mx-4">
        <div className="bg-slate-900/90 px-4 pt-3 pb-4 dock-shadow backdrop-blur">
          {isPlaying ? <Palette /> : <ResultPanel />}
        </div>
      </div>
    </div>
  );
}
