import { paths } from "@/app/paths";
import {
  useGameActorRef,
  useGameSelector,
} from "@/features/game/machine-context";
import { elapsedMs } from "@/features/game/machine";
import { qualifies, useHighScores } from "@/features/highscores/store";
import { formatDuration } from "@/utils/format";
import { Trophy } from "lucide-react";
import { useNavigate } from "react-router";

export function ResultPanel() {
  const actor = useGameActorRef();
  const navigate = useNavigate();
  const isWon = useGameSelector((snapshot) => snapshot.matches("won"));
  const context = useGameSelector((snapshot) => snapshot.context);
  const entries = useHighScores((state) => state.scores[context.difficulty]);
  const lastName = useHighScores((state) => state.lastName);
  const addEntry = useHighScores((state) => state.addEntry);

  const run = {
    guesses: context.guesses.length,
    elapsedMs: elapsedMs(context),
  };
  const isRecorded = entries.some((entry) => entry.id === context.startedAt);
  const canRecord = isWon && !isRecorded && qualifies(entries, run);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = String(new FormData(event.currentTarget).get("name")).trim();
    if (!name) return;

    addEntry(context.difficulty, {
      id: context.startedAt,
      name,
      ...run,
    });
    navigate(`${paths.highScores}?difficulty=${context.difficulty}`);
  }

  return (
    <section
      aria-live="polite"
      className="flex flex-col items-center gap-3 rounded-2xl bg-slate-800 p-4 text-center"
    >
      {isWon ? (
        <p className="flex items-center gap-2 text-lg font-semibold">
          <Trophy className="size-5 shrink-0 text-amber-400" />
          Cracked in {run.guesses} {run.guesses === 1 ? "guess" : "guesses"} ·{" "}
          {formatDuration(run.elapsedMs)}
        </p>
      ) : (
        <p className="text-lg font-semibold">
          Out of guesses — code revealed above
        </p>
      )}

      {canRecord && (
        <form onSubmit={handleSubmit} className="flex w-full gap-2">
          <label htmlFor="highscore-name" className="sr-only">
            Your name
          </label>
          <input
            id="highscore-name"
            name="name"
            required
            maxLength={20}
            // oxlint-disable-next-line jsx-a11y/autocomplete-valid -- `nickname` is a valid HTML token; the rule's list lacks it
            autoComplete="nickname"
            // oxlint-disable-next-line jsx-a11y/no-autofocus -- focus follows the player's own winning move, so it isn't a surprise
            autoFocus
            defaultValue={lastName}
            placeholder="Your name"
            className="min-w-0 flex-1 rounded-lg bg-slate-900 px-3 py-2 text-slate-100 ring-1 ring-slate-600 outline-none focus:ring-2 focus:ring-sky-400"
          />
          <button
            type="submit"
            className="rounded-lg bg-amber-500 px-4 py-2 font-semibold text-slate-900 hover:bg-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
          >
            Save score
          </button>
        </form>
      )}
      {isRecorded && <p className="text-sm text-emerald-400">Score saved</p>}

      <button
        type="button"
        onClick={() => actor.send({ type: "NEW_GAME" })}
        className="rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
      >
        New game
      </button>
    </section>
  );
}
