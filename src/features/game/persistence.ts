import type { SnapshotFrom } from "xstate";
import {
  COLORS,
  cryptoRandomInt,
  DIFFICULTIES,
  type Color,
  type Difficulty,
} from "./logic";
import { gameMachine, type GameContext } from "./machine";

export const GAME_STORAGE_KEY = "bulls-and-cows:game";
/* Bump when the saved shape changes; older saves are discarded, not migrated. */
const GAME_STORAGE_VERSION = 1;

const STATE_VALUES = ["playing", "won", "lost"] as const;

type StateValue = (typeof STATE_VALUES)[number];

type SavedGame = {
  version: number;
  value: StateValue;
  context: Omit<GameContext, "randomInt">;
};

type GameSnapshot = SnapshotFrom<typeof gameMachine>;

/*
 * Saves only the state value and plain context, not XState's internal
 * snapshot shape, so an XState upgrade can't invalidate stored games.
 * `randomInt` is a function and is re-attached on load.
 */
export function saveGame(snapshot: GameSnapshot): void {
  const { randomInt: _randomInt, ...context } = snapshot.context;
  const saved: SavedGame = {
    version: GAME_STORAGE_VERSION,
    value: snapshot.value as StateValue,
    context,
  };

  try {
    localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(saved));
  } catch {
    // Storage full or blocked (private mode): the game still plays, unsaved.
  }
}

/* Returns a restorable snapshot, or undefined to start a fresh game. */
export function loadGame(): GameSnapshot | undefined {
  let saved: unknown;
  try {
    saved = JSON.parse(localStorage.getItem(GAME_STORAGE_KEY) ?? "null");
  } catch {
    return undefined;
  }
  if (!isSavedGame(saved)) return undefined;

  return gameMachine.resolveState({
    value: saved.value,
    context: { ...saved.context, randomInt: cryptoRandomInt },
  });
}

function isColorRow(value: unknown, length: number): value is Color[] {
  return (
    Array.isArray(value) &&
    value.length === length &&
    value.every((peg) => COLORS.includes(peg))
  );
}

function isSavedGame(value: unknown): value is SavedGame {
  if (typeof value !== "object" || value === null) return false;

  const saved = value as Partial<SavedGame>;
  if (saved.version !== GAME_STORAGE_VERSION) return false;

  if (!STATE_VALUES.includes(saved.value as StateValue)) return false;

  const context = saved.context;
  if (typeof context !== "object" || context === null) return false;

  if (!Object.hasOwn(DIFFICULTIES, context.difficulty)) return false;

  const { pegs, maxGuesses } = DIFFICULTIES[context.difficulty as Difficulty];

  return (
    isColorRow(context.secret, pegs) &&
    Array.isArray(context.current) &&
    context.current.length === pegs &&
    context.current.every((peg) => peg === null || COLORS.includes(peg)) &&
    Array.isArray(context.guesses) &&
    context.guesses.length <= maxGuesses &&
    context.guesses.every(
      (guess) =>
        isColorRow(guess.pegs, pegs) &&
        typeof guess.black === "number" &&
        typeof guess.white === "number",
    ) &&
    typeof context.startedAt === "number" &&
    typeof context.finishedAt === "number"
  );
}
