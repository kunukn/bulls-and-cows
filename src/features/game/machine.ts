import { and, assign, emit, enqueueActions, raise, setup } from "xstate";
import {
  cryptoRandomInt,
  DIFFICULTIES,
  dodgeSecret,
  generateSecret,
  scoreGuess,
  type Color,
  type Difficulty,
  type Feedback,
  type RandomInt,
} from "./logic";

export type Guess = Feedback & { pegs: Color[] };

export type GameContext = {
  difficulty: Difficulty;
  secret: Color[];
  guesses: Guess[];
  current: (Color | null)[];
  /* Slot the next colour goes into; null when the row is full. */
  target: number | null;
  /* Filled slots in the order they were placed, so undo takes the latest. */
  placed: number[];
  /* Epoch ms of the first peg placed; 0 until the player starts. */
  startedAt: number;
  finishedAt: number;
  randomInt: RandomInt;
  /* The day's number in a daily game (0012); null in a practice game. */
  dailyNumber: number | null;
  /* The computer may swap the code after each guess (0013); never daily. */
  isSwapMode: boolean;
};

export type GameInput = {
  difficulty: Difficulty;
  randomInt?: RandomInt;
  dailyNumber?: number;
  isSwapMode?: boolean;
};

export type GameEvent =
  /* `isAutoSubmit`: check the guess once this peg completes the row. */
  | { type: "ADD_PEG"; color: Color; isAutoSubmit?: boolean }
  | { type: "REMOVE_PEG" }
  | { type: "CLEAR_SLOT"; index: number }
  /* Aim the next colour at a slot; a filled slot gets replaced. */
  | { type: "SELECT_SLOT"; index: number }
  | { type: "SUBMIT" }
  | { type: "AUTO_SUBMIT" }
  | { type: "GIVE_UP" }
  /* Practice only: a daily code gets one attempt (0012). */
  | { type: "NEW_GAME"; difficulty?: Difficulty; isSwapMode?: boolean }
  /* Daily only: move on to a later day's code, dealt by `randomInt`. */
  | { type: "NEXT_DAILY"; dailyNumber: number; randomInt: RandomInt };

/* Side-channel notices for the UI; they don't change game state. */
export type GameEmitted =
  | { type: "rowIncomplete" }
  /* A peg landed in the active row; `rowNumber` and `slot` match GuessRow. */
  | { type: "pegPlaced"; rowNumber: number; slot: number; color: Color }
  | { type: "pegRemoved"; rowNumber: number; slot: number; color: Color }
  /* An accepted guess, with its score; fires before any won/lost gameOver. */
  | { type: "scored"; black: number; white: number }
  /* Entering won or lost, including giving up. Not on a restored snapshot. */
  | { type: "gameOver"; isWon: boolean };

/* Lets the last peg's insert animation land before the row is checked. */
export const AUTO_SUBMIT_DELAY_MS = 250;

function emptyRow(difficulty: Difficulty): null[] {
  return Array(DIFFICULTIES[difficulty].pegs).fill(null);
}

function freshGame(difficulty: Difficulty, randomInt: RandomInt) {
  return {
    difficulty,
    secret: generateSecret(difficulty, randomInt),
    guesses: [],
    current: emptyRow(difficulty),
    target: 0,
    placed: [],
    startedAt: 0,
    finishedAt: 0,
  };
}

/* First empty slot after `from`, wrapping round; null when the row is full. */
export function nextEmptySlot(
  row: (Color | null)[],
  from: number,
): number | null {
  for (let step = 1; step <= row.length; step++) {
    const index = (from + step) % row.length;
    if (row[index] === null) return index;
  }

  return null;
}

function isComplete(row: (Color | null)[]): row is Color[] {
  return row.every((peg) => peg !== null);
}

let lastDodge:
  | {
      context: Pick<GameContext, "guesses" | "current" | "secret">;
      secret: Color[];
    }
  | undefined;

/*
 * The code the active row is scored against. In swap mode it is picked after
 * seeing the row (0013); remembered for the row, since the SUBMIT guard and
 * actions each ask and Hard checks up to 32,768 codes per ask.
 */
function secretFor(context: GameContext): Color[] {
  if (!context.isSwapMode || !isComplete(context.current))
    return context.secret;

  const { guesses, current, secret } = context;
  if (
    lastDodge?.context.guesses === guesses &&
    lastDodge.context.current === current &&
    lastDodge.context.secret === secret
  ) {
    return lastDodge.secret;
  }

  const dodged = dodgeSecret(context.difficulty, guesses, current, secret);
  lastDodge = { context: { guesses, current, secret }, secret: dodged };

  return dodged;
}

export function elapsedMs({ startedAt, finishedAt }: GameContext): number {
  return startedAt === 0 ? 0 : finishedAt - startedAt;
}

export const gameMachine = setup({
  types: {
    context: {} as GameContext,
    events: {} as GameEvent,
    input: {} as GameInput,
    emitted: {} as GameEmitted,
  },
  guards: {
    isPractice: ({ context }) => context.dailyNumber === null,
    isLaterDaily: ({ context, event }) =>
      event.type === "NEXT_DAILY" &&
      context.dailyNumber !== null &&
      event.dailyNumber > context.dailyNumber,
    hasNotStarted: ({ context }) => context.startedAt === 0,
    isRowComplete: ({ context }) => isComplete(context.current),
    isWinningGuess: ({ context }) =>
      isComplete(context.current) &&
      scoreGuess(secretFor(context), context.current).black ===
        DIFFICULTIES[context.difficulty].pegs,
    isLastGuess: ({ context }) =>
      isComplete(context.current) &&
      context.guesses.length + 1 >= DIFFICULTIES[context.difficulty].maxGuesses,
  },
  actions: {
    // Runs before the removal, while the slot still holds the peg.
    emitPegRemoved: enqueueActions(({ context, event, enqueue }) => {
      const slot =
        event.type === "CLEAR_SLOT" ? event.index : context.placed.at(-1);
      if (slot === undefined) return;

      const color = context.current[slot];
      if (!color) return;

      enqueue.emit({
        type: "pegRemoved",
        rowNumber: context.guesses.length + 1,
        slot,
        color,
      });
    }),
    // Runs before submitGuess; the SUBMIT guards ensure the row is complete.
    emitScored: emit(({ context }) => ({
      type: "scored" as const,
      ...scoreGuess(secretFor(context), context.current as Color[]),
    })),
    addPeg: assign(({ context, event }) => {
      if (event.type !== "ADD_PEG") return {};

      const index = context.target;
      if (index === null) return {};

      const current = [...context.current];
      current[index] = event.color;

      return {
        current,
        target: nextEmptySlot(current, index),
        // A replaced peg counts as the latest placement.
        placed: [...context.placed.filter((slot) => slot !== index), index],
        startedAt: context.startedAt || Date.now(),
      };
    }),
    // Undo: takes out the peg placed last, wherever it sits.
    removePeg: assign(({ context }) => {
      const index = context.placed.at(-1);
      if (index === undefined) return {};

      const current = [...context.current];
      current[index] = null;

      return { current, target: index, placed: context.placed.slice(0, -1) };
    }),
    clearSlot: assign(({ context, event }) => {
      if (event.type !== "CLEAR_SLOT") return {};

      // An empty slot has nothing to clear; leave the target alone.
      if (context.current[event.index] == null) return {};

      const current = [...context.current];
      current[event.index] = null;

      return {
        current,
        target: event.index,
        placed: context.placed.filter((slot) => slot !== event.index),
      };
    }),
    selectSlot: assign(({ context, event }) => {
      if (event.type !== "SELECT_SLOT") return {};

      const isInRow = event.index >= 0 && event.index < context.current.length;

      return isInRow ? { target: event.index } : {};
    }),
    submitGuess: assign(({ context }) => {
      if (!isComplete(context.current)) return {};

      const secret = secretFor(context);
      const guess: Guess = {
        pegs: context.current,
        ...scoreGuess(secret, context.current),
      };

      return {
        secret,
        guesses: [...context.guesses, guess],
        current: emptyRow(context.difficulty),
        target: 0,
        placed: [],
      };
    }),
    markFinished: assign({ finishedAt: () => Date.now() }),
    resetGame: assign(({ context, event }) => {
      if (event.type !== "NEW_GAME") return {};

      return {
        ...freshGame(event.difficulty ?? context.difficulty, context.randomInt),
        isSwapMode: event.isSwapMode ?? context.isSwapMode,
      };
    }),
    startNextDaily: assign(({ context, event }) => {
      if (event.type !== "NEXT_DAILY") return {};

      return {
        ...freshGame(context.difficulty, event.randomInt),
        randomInt: event.randomInt,
        dailyNumber: event.dailyNumber,
        isSwapMode: false,
      };
    }),
  },
}).createMachine({
  id: "game",
  context: ({ input }) => {
    const randomInt = input.randomInt ?? cryptoRandomInt;

    const dailyNumber = input.dailyNumber ?? null;

    return {
      ...freshGame(input.difficulty, randomInt),
      randomInt,
      dailyNumber,
      // A daily code is the same for everyone, so it never swaps (0012).
      isSwapMode: dailyNumber === null && (input.isSwapMode ?? false),
    };
  },
  initial: "playing",
  on: {
    NEW_GAME: { guard: "isPractice", target: ".playing", actions: "resetGame" },
  },
  states: {
    playing: {
      on: {
        ADD_PEG: {
          actions: [
            // Runs before addPeg, so a full row with no target stays silent.
            enqueueActions(({ context, event, enqueue }) => {
              const slot = context.target;
              if (slot === null) return;

              enqueue.emit({
                type: "pegPlaced",
                rowNumber: context.guesses.length + 1,
                slot,
                color: event.color,
              });
            }),
            "addPeg",
            // Runs after addPeg, so `context.current` already holds the new peg.
            enqueueActions(({ context, event, enqueue }) => {
              if (!event.isAutoSubmit || !isComplete(context.current)) return;

              enqueue.raise(
                { type: "AUTO_SUBMIT" },
                { delay: AUTO_SUBMIT_DELAY_MS },
              );
            }),
          ],
        },
        /*
         * Re-checked when it fires: an undo during the delay leaves the row
         * incomplete, so nothing is submitted and the row doesn't shake.
         */
        AUTO_SUBMIT: {
          guard: "isRowComplete",
          actions: raise({ type: "SUBMIT" }),
        },
        REMOVE_PEG: { actions: ["emitPegRemoved", "removePeg"] },
        CLEAR_SLOT: { actions: ["emitPegRemoved", "clearSlot"] },
        SELECT_SLOT: { actions: "selectSlot" },
        // Guards read the pre-submit row; first match wins.
        SUBMIT: [
          {
            guard: "isWinningGuess",
            target: "won",
            actions: ["emitScored", "submitGuess", "markFinished"],
          },
          {
            guard: "isLastGuess",
            target: "lost",
            actions: ["emitScored", "submitGuess", "markFinished"],
          },
          { guard: "isRowComplete", actions: ["emitScored", "submitGuess"] },
          // Rejected submit: lets the board shake the active row.
          { actions: emit({ type: "rowIncomplete" }) },
        ],
        // Ends the game as a loss so the secret is revealed.
        GIVE_UP: { target: "lost", actions: "markFinished" },
        // An untouched board may move on; a game under way is never replaced.
        NEXT_DAILY: {
          guard: and(["isLaterDaily", "hasNotStarted"]),
          target: "playing",
          actions: "startNextDaily",
        },
      },
    },
    won: {
      entry: emit({ type: "gameOver", isWon: true }),
      on: {
        NEXT_DAILY: {
          guard: "isLaterDaily",
          target: "playing",
          actions: "startNextDaily",
        },
      },
    },
    lost: {
      entry: emit({ type: "gameOver", isWon: false }),
      on: {
        NEXT_DAILY: {
          guard: "isLaterDaily",
          target: "playing",
          actions: "startNextDaily",
        },
      },
    },
  },
});
