import { createActor } from "xstate";
import { gameMachine } from "./machine";
import { GAME_STORAGE_KEY, loadGame, saveGame } from "./persistence";

const sequence = (values: number[]) => {
  let index = 0;

  return () => values[index++ % values.length];
};

beforeEach(() => localStorage.clear());

describe("game persistence", () => {
  it("restores an in-progress game after a reload", () => {
    const actor = createActor(gameMachine, {
      input: { difficulty: "classic", randomInt: sequence([0, 4, 3, 2]) },
    }).start();
    actor.subscribe(saveGame);
    for (const color of ["cyan", "red", "green", "yellow"] as const) {
      actor.send({ type: "ADD_PEG", color });
    }
    actor.send({ type: "SUBMIT" });
    actor.send({ type: "ADD_PEG", color: "red" });

    const restored = createActor(gameMachine, {
      input: { difficulty: "easy" },
      snapshot: loadGame(),
    }).start();
    const { context, value } = restored.getSnapshot();

    expect(value).toBe("playing");
    expect(context.difficulty).toBe("classic");
    expect(context.secret).toEqual(["red", "cyan", "green", "yellow"]);
    expect(context.guesses).toHaveLength(1);
    expect(context.current).toEqual(["red", null, null, null]);
    expect(context.startedAt).toBe(actor.getSnapshot().context.startedAt);

    // randomInt is re-attached, so starting a new game still works.
    restored.send({ type: "NEW_GAME" });
    expect(restored.getSnapshot().context.guesses).toEqual([]);
  });

  it("rebuilds the slot target for a game saved before targeting", () => {
    localStorage.setItem(
      GAME_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        value: "playing",
        context: {
          difficulty: "classic",
          secret: ["red", "cyan", "green", "yellow"],
          guesses: [],
          current: ["red", "cyan", null, null],
          startedAt: 1,
          finishedAt: 0,
        },
      }),
    );

    const { context } = loadGame()!;

    expect(context.target).toBe(2);
    expect(context.placed).toEqual([0, 1]);
  });

  it("keeps a saved slot target", () => {
    const actor = createActor(gameMachine, {
      input: { difficulty: "classic", randomInt: sequence([0]) },
    }).start();
    actor.subscribe(saveGame);
    actor.send({ type: "SELECT_SLOT", index: 3 });
    actor.send({ type: "ADD_PEG", color: "green" });

    const { context } = loadGame()!;

    expect(context.target).toBe(0);
    expect(context.placed).toEqual([3]);
  });

  it("restores a finished game in its final state", () => {
    const actor = createActor(gameMachine, {
      input: { difficulty: "classic", randomInt: sequence([0, 4, 3, 2]) },
    }).start();
    actor.subscribe(saveGame);
    for (const color of ["red", "cyan", "green", "yellow"] as const) {
      actor.send({ type: "ADD_PEG", color });
    }
    actor.send({ type: "SUBMIT" });

    expect(loadGame()?.value).toBe("won");
  });

  it.each([
    ["nothing saved", null],
    ["invalid JSON", "{"],
    ["an old version", JSON.stringify({ version: 0 })],
    [
      "a secret of the wrong length",
      JSON.stringify({
        version: 1,
        value: "playing",
        context: {
          difficulty: "classic",
          secret: ["red"],
          guesses: [],
          current: [null, null, null, null],
          startedAt: 0,
          finishedAt: 0,
        },
      }),
    ],
    [
      "a colour outside the difficulty's palette",
      JSON.stringify({
        version: 1,
        value: "playing",
        context: {
          difficulty: "classic",
          secret: ["red", "cyan", "green", "blue"],
          guesses: [],
          current: [null, null, null, null],
          startedAt: 0,
          finishedAt: 0,
        },
      }),
    ],
  ])("starts fresh given %s", (_label, stored) => {
    if (stored !== null) localStorage.setItem(GAME_STORAGE_KEY, stored);

    expect(loadGame()).toBeUndefined();
  });
});
