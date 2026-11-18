import { assign, setup } from "xstate";
import {
  cryptoRandomInt,
  DIFFICULTIES,
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
  /* Epoch ms of the first peg placed; 0 until the player starts. */
  startedAt: number;
  finishedAt: number;
  randomInt: RandomInt;
};

export type GameInput = {
  difficulty: Difficulty;
  randomInt?: RandomInt;
};

export type GameEvent =
  | { type: "ADD_PEG"; color: Color }
  | { type: "REMOVE_PEG" }
  | { type: "CLEAR_SLOT"; index: number }
  | { type: "SUBMIT" }
  | { type: "GIVE_UP" }
  | { type: "NEW_GAME"; difficulty?: Difficulty };

function emptyRow(difficulty: Difficulty): null[] {
  return Array(DIFFICULTIES[difficulty].pegs).fill(null);
}

function freshGame(difficulty: Difficulty, randomInt: RandomInt) {
  return {
    difficulty,
    secret: generateSecret(difficulty, randomInt),
    guesses: [],
    current: emptyRow(difficulty),
    startedAt: 0,
    finishedAt: 0,
  };
}

function isComplete(row: (Color | null)[]): row is Color[] {
  return row.every((peg) => peg !== null);
}

export function elapsedMs({ startedAt, finishedAt }: GameContext): number {
  return startedAt === 0 ? 0 : finishedAt - startedAt;
}

export const gameMachine = setup({
  types: {
    context: {} as GameContext,
    events: {} as GameEvent,
    input: {} as GameInput,
  },
  guards: {
    isRowComplete: ({ context }) => isComplete(context.current),
    isWinningGuess: ({ context }) =>
      isComplete(context.current) &&
      scoreGuess(context.secret, context.current).black ===
        DIFFICULTIES[context.difficulty].pegs,
    isLastGuess: ({ context }) =>
      isComplete(context.current) &&
      context.guesses.length + 1 >= DIFFICULTIES[context.difficulty].maxGuesses,
  },
  actions: {
    addPeg: assign(({ context, event }) => {
      if (event.type !== "ADD_PEG") return {};

      const index = context.current.indexOf(null);
      if (index === -1) return {};

      const current = [...context.current];
      current[index] = event.color;

      return {
        current,
        startedAt: context.startedAt || Date.now(),
      };
    }),
    removePeg: assign(({ context }) => {
      const index = context.current.findLastIndex((peg) => peg !== null);
      if (index === -1) return {};

      const current = [...context.current];
      current[index] = null;

      return { current };
    }),
    clearSlot: assign(({ context, event }) => {
      if (event.type !== "CLEAR_SLOT") return {};

      const current = [...context.current];
      current[event.index] = null;

      return { current };
    }),
    submitGuess: assign(({ context }) => {
      if (!isComplete(context.current)) return {};

      const guess: Guess = {
        pegs: context.current,
        ...scoreGuess(context.secret, context.current),
      };

      return {
        guesses: [...context.guesses, guess],
        current: emptyRow(context.difficulty),
      };
    }),
    markFinished: assign({ finishedAt: () => Date.now() }),
    resetGame: assign(({ context, event }) => {
      const difficulty =
        event.type === "NEW_GAME" && event.difficulty
          ? event.difficulty
          : context.difficulty;

      return freshGame(difficulty, context.randomInt);
    }),
  },
}).createMachine({
  id: "game",
  context: ({ input }) => {
    const randomInt = input.randomInt ?? cryptoRandomInt;

    return { ...freshGame(input.difficulty, randomInt), randomInt };
  },
  initial: "playing",
  on: {
    NEW_GAME: { target: ".playing", actions: "resetGame" },
  },
  states: {
    playing: {
      on: {
        ADD_PEG: { actions: "addPeg" },
        REMOVE_PEG: { actions: "removePeg" },
        CLEAR_SLOT: { actions: "clearSlot" },
        // Guards read the pre-submit row; first match wins.
        SUBMIT: [
          {
            guard: "isWinningGuess",
            target: "won",
            actions: ["submitGuess", "markFinished"],
          },
          {
            guard: "isLastGuess",
            target: "lost",
            actions: ["submitGuess", "markFinished"],
          },
          { guard: "isRowComplete", actions: "submitGuess" },
        ],
        // Ends the game as a loss so the secret is revealed.
        GIVE_UP: { target: "lost", actions: "markFinished" },
      },
    },
    won: {},
    lost: {},
  },
});
