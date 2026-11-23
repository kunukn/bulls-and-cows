import { DIFFICULTIES } from "@/features/game/logic";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DAILY_DIFFICULTY } from "./daily";

export type DailyResult = {
  isWon: boolean;
  guesses: number;
  elapsedMs: number;
};

/* Keyed by daily number. A day that was never finished has no entry. */
export type DailyResults = Record<number, DailyResult>;

export type DailySummary = {
  played: number;
  won: number;
  /* Days won in a row, up to today — or yesterday while today is unplayed. */
  currentStreak: number;
  bestStreak: number;
  /* Wins per guess count: index 0 is a win on the first guess. */
  distribution: number[];
};

/*
 * Stats are worked out from the per-day results instead of being stored as
 * counters, so a streak can never disagree with the days behind it.
 */
export function summarize(results: DailyResults, today: number): DailySummary {
  const distribution: number[] = Array(
    DIFFICULTIES[DAILY_DIFFICULTY].maxGuesses,
  ).fill(0);
  const wonDays: number[] = [];

  for (const [day, result] of Object.entries(results)) {
    if (!result.isWon) continue;

    wonDays.push(Number(day));
    distribution[result.guesses - 1]++;
  }

  let bestStreak = 0;
  let run = 0;
  let previous: number | null = null;
  for (const day of wonDays.toSorted((a, b) => a - b)) {
    run = previous !== null && day === previous + 1 ? run + 1 : 1;
    bestStreak = Math.max(bestStreak, run);
    previous = day;
  }

  // Today's code can still be won, so an unplayed today doesn't end a streak.
  let day = results[today] ? today : today - 1;
  let currentStreak = 0;
  while (results[day]?.isWon) {
    currentStreak++;
    day--;
  }

  return {
    played: Object.keys(results).length,
    won: wonDays.length,
    currentStreak,
    bestStreak,
    distribution,
  };
}

type DailyResultsStore = {
  results: DailyResults;
  /* A day's first result stands: a daily code gets one attempt. */
  record: (dailyNumber: number, result: DailyResult) => void;
};

export const useDailyResults = create<DailyResultsStore>()(
  persist(
    (set) => ({
      results: {},
      record: (dailyNumber, result) =>
        set((state) =>
          state.results[dailyNumber]
            ? state
            : { results: { ...state.results, [dailyNumber]: result } },
        ),
    }),
    { name: "app:daily", version: 1 },
  ),
);
