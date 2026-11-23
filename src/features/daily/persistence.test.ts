import { DIFFICULTIES, paletteFor, type Color } from "@/features/game/logic";
import { gameMachine } from "@/features/game/machine";
import { GAME_STORAGE_KEY, loadGame } from "@/features/game/persistence";
import { createActor } from "xstate";
import { DAILY_DIFFICULTY, dailyGameInput, dailySecret } from "./daily";
import { loadDailyGame, recordDailyResult, saveDailyGame } from "./persistence";
import { useDailyResults } from "./store";

const TODAY = 5;

/* A daily game wired the way DailyMachineProvider wires it. */
function startDailyGame(number = TODAY) {
  const actor = createActor(gameMachine, {
    input: dailyGameInput(number),
    snapshot: loadDailyGame(number),
  }).start();
  actor.subscribe((snapshot) => {
    saveDailyGame(snapshot);
    recordDailyResult(snapshot);
  });

  return actor;
}

function guess(actor: ReturnType<typeof startDailyGame>, colors: Color[]) {
  for (const color of colors) actor.send({ type: "ADD_PEG", color });
  actor.send({ type: "SUBMIT" });
}

/* A full row that can't win: the secret with its first peg swapped. */
function wrongGuess(number = TODAY): Color[] {
  const [first, ...rest] = dailySecret(number);
  const other = paletteFor(DAILY_DIFFICULTY).find((color) => color !== first);

  return [other ?? first, ...rest];
}

beforeEach(() => {
  localStorage.clear();
  useDailyResults.setState(useDailyResults.getInitialState(), true);
});

describe("daily game save", () => {
  it("restores today's game after a reload", () => {
    const actor = startDailyGame();
    guess(actor, wrongGuess());

    const { context, value } = startDailyGame().getSnapshot();

    expect(value).toBe("playing");
    expect(context.guesses).toHaveLength(1);
    expect(context.secret).toEqual(dailySecret(TODAY));
    expect(context.dailyNumber).toBe(TODAY);
  });

  it("keeps a finished day finished: no second attempt after a reload", () => {
    guess(startDailyGame(), dailySecret(TODAY));

    const restored = startDailyGame();
    restored.send({ type: "NEW_GAME" });

    expect(restored.getSnapshot().value).toBe("won");
  });

  it("starts fresh the next day", () => {
    guess(startDailyGame(), wrongGuess());

    const { context } = startDailyGame(TODAY + 1).getSnapshot();

    expect(context.guesses).toHaveLength(0);
    expect(context.secret).toEqual(dailySecret(TODAY + 1));
  });

  it("leaves the practice game's save alone", () => {
    guess(startDailyGame(), wrongGuess());

    expect(localStorage.getItem(GAME_STORAGE_KEY)).toBeNull();
    expect(loadGame()).toBeUndefined();
  });
});

describe("daily results", () => {
  it("records a win with its guess count", () => {
    const actor = startDailyGame();
    guess(actor, wrongGuess());
    guess(actor, dailySecret(TODAY));

    expect(useDailyResults.getState().results[TODAY]).toMatchObject({
      isWon: true,
      guesses: 2,
    });
  });

  it("records nothing while the game is in progress", () => {
    guess(startDailyGame(), wrongGuess());

    expect(useDailyResults.getState().results).toEqual({});
  });

  it("records running out of guesses as a loss", () => {
    const actor = startDailyGame();
    const { maxGuesses } = DIFFICULTIES[DAILY_DIFFICULTY];
    for (let row = 0; row < maxGuesses; row++) guess(actor, wrongGuess());

    expect(useDailyResults.getState().results[TODAY]).toMatchObject({
      isWon: false,
      guesses: maxGuesses,
    });
  });

  it("records revealing the code as a loss", () => {
    startDailyGame().send({ type: "GIVE_UP" });

    expect(useDailyResults.getState().results[TODAY]?.isWon).toBe(false);
  });
});
