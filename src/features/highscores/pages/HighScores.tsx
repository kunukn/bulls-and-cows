import { DifficultyPicker } from "@/components/DifficultyPicker";
import { DIFFICULTY_KEYS, type Difficulty } from "@/features/game/logic";
import { useSettings } from "@/features/game/store/settings";
import { formatDate, formatDuration } from "@/utils/format";
import { useSearchParams } from "react-router";
import { useHighScores } from "../store";

function isDifficulty(value: string | null): value is Difficulty {
  return DIFFICULTY_KEYS.includes(value as Difficulty);
}

export function HighScores() {
  const [searchParams, setSearchParams] = useSearchParams();
  const fallback = useSettings((state) => state.difficulty);
  const param = searchParams.get("difficulty");
  const difficulty = isDifficulty(param) ? param : fallback;
  const entries = useHighScores((state) => state.scores[difficulty]);
  const clear = useHighScores((state) => state.clear);

  function handleClear() {
    if (window.confirm("Delete all high scores for every difficulty?")) clear();
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">High scores</h2>
      <DifficultyPicker
        name="highscore-difficulty"
        legend="Show high scores for"
        value={difficulty}
        onChange={(next) =>
          setSearchParams({ difficulty: next }, { replace: true })
        }
      />

      {entries.length === 0 ? (
        <p className="rounded-2xl bg-slate-800 p-6 text-center text-slate-400">
          No scores yet. Win a game to get on the board.
        </p>
      ) : (
        <table className="w-full overflow-hidden rounded-2xl bg-slate-800 text-left text-sm">
          <thead className="bg-slate-700/60 text-xs tracking-wide text-slate-300 uppercase">
            <tr>
              <th scope="col" className="px-3 py-2">
                #
              </th>
              <th scope="col" className="px-3 py-2">
                Name
              </th>
              <th scope="col" className="px-3 py-2 text-right">
                Guesses
              </th>
              <th scope="col" className="px-3 py-2 text-right">
                Time
              </th>
              <th
                scope="col"
                className="hidden px-3 py-2 text-right sm:table-cell"
              >
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <tr key={entry.id} className="border-t border-slate-700">
                <td className="px-3 py-2 text-slate-400 tabular-nums">
                  {index + 1}
                </td>
                <td className="max-w-32 truncate px-3 py-2 font-medium">
                  {entry.name}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {entry.guesses}
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">
                  {formatDuration(entry.elapsedMs)}
                </td>
                <td className="hidden px-3 py-2 text-right text-slate-400 sm:table-cell">
                  {formatDate(entry.achievedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button
        type="button"
        onClick={handleClear}
        className="self-end text-sm text-slate-400 underline-offset-2 hover:text-red-400 hover:underline"
      >
        Clear all scores
      </button>
    </div>
  );
}
