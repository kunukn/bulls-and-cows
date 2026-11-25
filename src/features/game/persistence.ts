import type { SnapshotFrom } from "xstate";
import {
  cryptoRandomInt,
  DIFFICULTIES,
  paletteFor,
  type Color,
  type Difficulty,
} from "./logic";
import { gameMachine, nextEmptySlot, type GameContext } from "./machine";

export const GAME_STORAGE_KEY = "app:game";
/* Bump when the saved shape changes; older saves are discarded, not migrated. */
const GAME_STORAGE_VERSION = 1;

const STATE_VALUES = ["playing", "won", "lost"] as const;

type StateValue = (typeof STATE_VALUES)[number];

type Placement = Pick<GameContext, "target" | "placed">;

/*
 * Saves from before slot targeting have no placement; it is rebuilt on load.
 * Saves from before the daily code have no `dailyNumber`; they are practice
 * games. Saves from before swap mode have no `isSwapMode`; they never swap.
 */
type OptionalSaved = "dailyNumber" | "isSwapMode";

type SavedGame = {
  version: number;
  value: StateValue;
  context: Omit<GameContext, "randomInt" | OptionalSaved | keyof Placement> &
    Partial<Placement & Pick<GameContext, OptionalSaved>>;
};

type GameSnapshot = SnapshotFrom<typeof gameMachine>;

/*
 * Saves only the state value and plain context, not XState's internal
 * snapshot shape, so an XState upgrade can't invalidate stored games.
 * `randomInt` is a function and is re-attached on load.
 */
export function saveGame(
  snapshot: GameSnapshot,
  storageKey = GAME_STORAGE_KEY,
): void {
  const { randomInt: _randomInt, ...context } = snapshot.context;
  const saved: SavedGame = {
    version: GAME_STORAGE_VERSION,
    value: snapshot.value as StateValue,
    context,
  };

  try {
    localStorage.setItem(storageKey, JSON.stringify(saved));
  } catch {
    // Storage full or blocked (private mode): the game still plays, unsaved.
  }
}

/* Returns a restorable snapshot, or undefined to start a fresh game. */
export function loadGame(
  storageKey = GAME_STORAGE_KEY,
): GameSnapshot | undefined {
  let saved: unknown;
  try {
    saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
  } catch {
    return undefined;
  }
  if (!isSavedGame(saved)) return undefined;

  return gameMachine.resolveState({
    value: saved.value,
    context: {
      ...saved.context,
      ...restorePlacement(saved.context),
      dailyNumber: saved.context.dailyNumber ?? null,
      isSwapMode: saved.context.isSwapMode ?? false,
      randomInt: cryptoRandomInt,
    },
  });
}

/* Keeps a saved placement, or rebuilds one as if filled left to right. */
function restorePlacement(context: SavedGame["context"]): Placement {
  if (context.target !== undefined && context.placed !== undefined) {
    return { target: context.target, placed: context.placed };
  }

  const { current } = context;
  const placed = current.flatMap((peg, index) => (peg ? [index] : []));

  return { target: nextEmptySlot(current, current.length - 1), placed };
}

function isSlot(value: unknown, length: number): value is number {
  return (
    Number.isInteger(value) &&
    (value as number) >= 0 &&
    (value as number) < length
  );
}

function isColorRow(
  value: unknown,
  length: number,
  palette: readonly Color[],
): value is Color[] {
  return (
    Array.isArray(value) &&
    value.length === length &&
    value.every((peg) => palette.includes(peg))
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

  const difficulty = context.difficulty as Difficulty;
  const { pegs, maxGuesses } = DIFFICULTIES[difficulty];
  /*
   * Pegs must come from the difficulty's own palette: a save from before the
   * palettes changed could hold a colour the palette no longer offers, and
   * that game could never be won.
   */
  const palette = paletteFor(difficulty);

  return (
    isColorRow(context.secret, pegs, palette) &&
    Array.isArray(context.current) &&
    context.current.length === pegs &&
    context.current.every((peg) => peg === null || palette.includes(peg)) &&
    Array.isArray(context.guesses) &&
    context.guesses.length <= maxGuesses &&
    context.guesses.every(
      (guess) =>
        isColorRow(guess.pegs, pegs, palette) &&
        typeof guess.black === "number" &&
        typeof guess.white === "number",
    ) &&
    (context.target === undefined ||
      context.target === null ||
      isSlot(context.target, pegs)) &&
    (context.placed === undefined ||
      (Array.isArray(context.placed) &&
        context.placed.every((slot) => isSlot(slot, pegs)))) &&
    typeof context.startedAt === "number" &&
    typeof context.finishedAt === "number" &&
    (context.dailyNumber === undefined ||
      context.dailyNumber === null ||
      Number.isInteger(context.dailyNumber)) &&
    (context.isSwapMode === undefined ||
      typeof context.isSwapMode === "boolean")
  );
}
