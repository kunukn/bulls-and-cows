import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DifficultyPicker } from "@/components/DifficultyPicker";
import { DailyHeader } from "@/features/daily/components/DailyHeader";
import { DailyLink } from "@/features/daily/components/DailyLink";
import { DailyResultPanel } from "@/features/daily/components/DailyResultPanel";
import { paletteFor, type Difficulty } from "@/features/game/logic";
import {
  useGameActorRef,
  useGameSelector,
} from "@/features/game/machine-context";
import { useSettings } from "@/features/game/store/settings";
import { cn } from "@/utils/cn";
import { Shuffle } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Board } from "../components/Board";
import { COW_PEG_CLASS, useBullPegClass } from "../components/FeedbackPegs";
import { GameMenu } from "../components/GameMenu";
import { Palette } from "../components/Palette";
import { ResultPanel } from "../components/ResultPanel";
import { Timer } from "../components/Timer";

export function Play() {
  const { t } = useTranslation();
  const actor = useGameActorRef();
  const difficulty = useGameSelector((snapshot) => snapshot.context.difficulty);
  // Set when this is the daily code's game instead of a practice game (0012).
  const dailyNumber = useGameSelector(
    (snapshot) => snapshot.context.dailyNumber,
  );
  const isPlaying = useGameSelector((snapshot) => snapshot.matches("playing"));
  // The game's own mode, not the setting: a switch flipped mid-game waits (0013).
  const isSwapMode = useGameSelector((snapshot) => snapshot.context.isSwapMode);
  const hasProgress = useGameSelector(
    (snapshot) => snapshot.context.startedAt > 0,
  );
  const setDifficulty = useSettings((state) => state.setDifficulty);
  const isTimerVisible = useSettings((state) => state.isTimerVisible);
  const isMinimalText = useSettings((state) => state.isMinimalText);
  const isDailyEnabled = useSettings((state) => state.isDailyEnabled);
  const isAutoSubmit = useSettings((state) => state.isAutoSubmit);
  const bullPegClass = useBullPegClass();
  // Hidden only while playing; the final time shows once the game ends.
  const isTimerShown = isTimerVisible || !isPlaying;
  // Difficulty waiting on the abandon dialog; null while it is closed.
  const [pendingDifficulty, setPendingDifficulty] = useState<Difficulty | null>(
    null,
  );

  function startGame(next: Difficulty) {
    setDifficulty(next);
    actor.send({
      type: "NEW_GAME",
      difficulty: next,
      isSwapMode: useSettings.getState().isSwapEnabled,
    });
  }

  function changeDifficulty(next: Difficulty) {
    if (isPlaying && hasProgress) {
      setPendingDifficulty(next);

      return;
    }

    startGame(next);
  }

  /*
   * With Auto check on, a full row is always checked (0008): the last peg
   * does it, and this covers a row filled before the switch was turned on,
   * or one a saved game came back with. The machine ignores it for a row
   * that isn't full.
   */
  useEffect(() => {
    if (isAutoSubmit) actor.send({ type: "AUTO_SUBMIT" });
  }, [actor, isAutoSubmit]);

  /*
   * Keys 1–8 add a colour, ←/→ move the target slot, Backspace undoes,
   * Enter checks the row.
   */
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!isPlaying || event.metaKey || event.ctrlKey || event.altKey) return;

      const target =
        event.target instanceof Element ? event.target : document.body;
      // Leave typing fields alone; the difficulty radios keep shortcuts working.
      if (target.closest("input:not([type=radio]), textarea, select")) return;

      // An open dialog or menu (Settings drawer, game menu) owns the keyboard.
      if (target.closest("[role=dialog], [role=alertdialog], [role=menu]")) {
        return;
      }

      const palette = paletteFor(difficulty);
      const digit = Number(event.key);

      if (digit >= 1 && digit <= palette.length) {
        actor.send({
          type: "ADD_PEG",
          color: palette[digit - 1],
          isAutoSubmit: useSettings.getState().isAutoSubmit,
        });
      } else if (
        (event.key === "ArrowLeft" || event.key === "ArrowRight") &&
        // Arrows already move between the difficulty radios.
        !target.closest("input")
      ) {
        event.preventDefault();
        const { target: slot, current } = actor.getSnapshot().context;
        // The row mirrors in RTL, so "right" walks back towards slot 1.
        const isRtl = document.documentElement.dir === "rtl";
        const step = (event.key === "ArrowRight") !== isRtl ? 1 : -1;
        const from = slot ?? (step === 1 ? -1 : current.length);
        const index = Math.min(Math.max(from + step, 0), current.length - 1);
        actor.send({ type: "SELECT_SLOT", index });
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
      {dailyNumber === null ? (
        <>
          {isDailyEnabled && <DailyLink />}
          <DifficultyPicker
            name="difficulty"
            legend={t("difficulty.legend")}
            value={difficulty}
            onChange={changeDifficulty}
          />
        </>
      ) : (
        <DailyHeader number={dailyNumber} />
      )}
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
        <div className="flex items-center justify-between gap-3 ps-1 text-xs text-muted-foreground">
          {!isMinimalText && (
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="flex items-center gap-1.5">
                <span className={cn("size-2.5 rounded-full", bullPegClass)} />
                {t("game.legendBull")}
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "size-2.5 rounded-full ring-1 ring-black/20",
                    COW_PEG_CLASS,
                  )}
                />
                {t("game.legendCow")}
              </span>
            </span>
          )}
          <span className="ms-auto flex items-center gap-3">
            {isSwapMode && (
              <span
                title={t("common.swapColorsDescription")}
                className="flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 font-medium text-warning"
              >
                <Shuffle aria-hidden className="size-3.5" />
                <span className={isMinimalText ? "sr-only" : undefined}>
                  {t("game.swapBadge")}
                </span>
              </span>
            )}
            {/* No Give up on the daily code: one tap would spoil it for others (0012). */}
            {isPlaying && dailyNumber === null && <GameMenu />}
            {isTimerShown && <Timer />}
          </span>
        </div>
      )}
      <Board />
      {/* Sticky: on short viewports the board scrolls under the controls. */}
      <div className="dock sticky bottom-0 -mx-4">
        <div className="dock-surface px-4 pt-3 pb-4">
          {isPlaying && <Palette />}
          {!isPlaying &&
            (dailyNumber === null ? <ResultPanel /> : <DailyResultPanel />)}
        </div>
      </div>
    </div>
  );
}
