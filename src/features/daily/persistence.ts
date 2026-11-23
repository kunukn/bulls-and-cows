import { elapsedMs, type gameMachine } from "@/features/game/machine";
import { loadGame, saveGame } from "@/features/game/persistence";
import type { SnapshotFrom } from "xstate";
import { useDailyResults } from "./store";

export const DAILY_GAME_STORAGE_KEY = "app:daily-game";

type GameSnapshot = SnapshotFrom<typeof gameMachine>;

/* The daily game has its own save, so it never replaces a practice game. */
export function saveDailyGame(snapshot: GameSnapshot): void {
  saveGame(snapshot, DAILY_GAME_STORAGE_KEY);
}

/*
 * Today's saved game, in progress or finished. A finished one is what keeps
 * the day to a single attempt. A save from an earlier day is left behind.
 */
export function loadDailyGame(today: number): GameSnapshot | undefined {
  const snapshot = loadGame(DAILY_GAME_STORAGE_KEY);

  return snapshot?.context.dailyNumber === today ? snapshot : undefined;
}

/* Adds a finished daily game to the stats; a game in progress is ignored. */
export function recordDailyResult(snapshot: GameSnapshot): void {
  const { dailyNumber, guesses } = snapshot.context;
  if (dailyNumber === null || snapshot.matches("playing")) return;

  useDailyResults.getState().record(dailyNumber, {
    isWon: snapshot.matches("won"),
    guesses: guesses.length,
    elapsedMs: elapsedMs(snapshot.context),
  });
}
