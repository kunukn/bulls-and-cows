import { DifficultyPicker } from "@/components/DifficultyPicker";
import { paletteFor, type Difficulty } from "@/features/game/logic";
import {
  useGameActorRef,
  useGameSelector,
} from "@/features/game/machine-context";
import { useSettings } from "@/features/game/store/settings";
import { useEffect } from "react";
import { Board } from "../components/Board";
import { Palette } from "../components/Palette";
import { ResultPanel } from "../components/ResultPanel";
import { Timer } from "../components/Timer";

export function Play() {
  const actor = useGameActorRef();
  const difficulty = useGameSelector((snapshot) => snapshot.context.difficulty);
  const isPlaying = useGameSelector((snapshot) => snapshot.matches("playing"));
  const hasProgress = useGameSelector(
    (snapshot) => snapshot.context.startedAt > 0,
  );
  const setDifficulty = useSettings((state) => state.setDifficulty);

  function changeDifficulty(next: Difficulty) {
    if (
      isPlaying &&
      hasProgress &&
      !window.confirm("Abandon the current game?")
    )
      return;

    setDifficulty(next);
    actor.send({ type: "NEW_GAME", difficulty: next });
  }

  /* Keys 1–8 add a colour, Backspace undoes, Enter checks the row. */
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!isPlaying || event.metaKey || event.ctrlKey || event.altKey) return;

      const target =
        event.target instanceof Element ? event.target : document.body;
      // Leave typing fields alone; the difficulty radios keep shortcuts working.
      if (target.closest("input:not([type=radio]), textarea, select")) return;

      const palette = paletteFor(difficulty);
      const digit = Number(event.key);

      if (digit >= 1 && digit <= palette.length) {
        actor.send({ type: "ADD_PEG", color: palette[digit - 1] });
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
        legend="Difficulty"
        value={difficulty}
        onChange={changeDifficulty}
      />
      <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-zinc-950 ring-1 ring-zinc-400" />
            Bull: right spot
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-white" />
            Cow: wrong spot
          </span>
        </span>
        <Timer />
      </div>
      <Board />
      {isPlaying ? <Palette /> : <ResultPanel />}
    </div>
  );
}
