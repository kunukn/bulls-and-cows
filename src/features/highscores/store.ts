import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Difficulty } from "@/features/game/logic";

export const MAX_ENTRIES = 10;

export type HighScoreEntry = {
  /* The game's `startedAt` — makes recording idempotent per run. */
  id: number;
  name: string;
  guesses: number;
  elapsedMs: number;
  achievedAt: number;
};

export type RunResult = Pick<HighScoreEntry, "guesses" | "elapsedMs">;

type Board = Record<Difficulty, HighScoreEntry[]>;

const emptyBoard = (): Board => ({ easy: [], classic: [], hard: [] });

/* Fewer guesses wins; ties broken by time, then by who got there first. */
export function compareEntries(a: HighScoreEntry, b: HighScoreEntry): number {
  return (
    a.guesses - b.guesses ||
    a.elapsedMs - b.elapsedMs ||
    a.achievedAt - b.achievedAt
  );
}

export function qualifies(entries: HighScoreEntry[], run: RunResult): boolean {
  if (entries.length < MAX_ENTRIES) return true;

  const worst = entries[entries.length - 1];

  return compareEntries({ ...worst, ...run, achievedAt: Infinity }, worst) < 0;
}

type HighScoresStore = {
  scores: Board;
  lastName: string;
  addEntry: (
    difficulty: Difficulty,
    entry: Omit<HighScoreEntry, "achievedAt">,
  ) => void;
  clear: () => void;
};

export const useHighScores = create<HighScoresStore>()(
  persist(
    (set) => ({
      scores: emptyBoard(),
      lastName: "",
      addEntry: (difficulty, entry) =>
        set((state) => {
          const existing = state.scores[difficulty];
          if (existing.some((item) => item.id === entry.id)) return state;

          const entries = [...existing, { ...entry, achievedAt: Date.now() }]
            .sort(compareEntries)
            .slice(0, MAX_ENTRIES);

          return {
            scores: { ...state.scores, [difficulty]: entries },
            lastName: entry.name,
          };
        }),
      clear: () => set({ scores: emptyBoard() }),
    }),
    { name: "app:highscores", version: 1 },
  ),
);
