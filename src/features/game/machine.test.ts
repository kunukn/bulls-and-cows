import { createActor } from "xstate";
import type { Color } from "./logic";
import { gameMachine } from "./machine";

/* RNG always returning 0 → classic secret is red×4, easy is red/blue/green/yellow. */
function startGame(difficulty: "easy" | "classic" | "hard" = "classic") {
  const actor = createActor(gameMachine, {
    input: { difficulty, randomInt: () => 0 },
  });
  actor.start();

  return actor;
}

function guess(actor: ReturnType<typeof startGame>, colors: Color[]) {
  colors.forEach((color) => actor.send({ type: "ADD_PEG", color }));
  actor.send({ type: "SUBMIT" });
}

describe("gameMachine", () => {
  it("ignores SUBMIT on an incomplete row", () => {
    const actor = startGame();
    actor.send({ type: "ADD_PEG", color: "blue" });
    actor.send({ type: "SUBMIT" });

    expect(actor.getSnapshot().context.guesses).toHaveLength(0);
    expect(actor.getSnapshot().context.current).toEqual([
      "blue",
      null,
      null,
      null,
    ]);
  });

  it("edits the current row", () => {
    const actor = startGame();
    (["blue", "green", "yellow"] as const).forEach((color) =>
      actor.send({ type: "ADD_PEG", color }),
    );
    actor.send({ type: "REMOVE_PEG" });
    actor.send({ type: "CLEAR_SLOT", index: 0 });
    actor.send({ type: "ADD_PEG", color: "red" });

    expect(actor.getSnapshot().context.current).toEqual([
      "red",
      "green",
      null,
      null,
    ]);
  });

  it("scores a guess and starts the clock", () => {
    const actor = startGame();
    guess(actor, ["red", "blue", "red", "green"]);
    const { context } = actor.getSnapshot();

    expect(context.guesses[0]).toMatchObject({ black: 2, white: 0 });
    expect(context.startedAt).toBeGreaterThan(0);
    expect(actor.getSnapshot().value).toBe("playing");
  });

  it("wins on the correct code", () => {
    const actor = startGame("easy");
    guess(actor, ["red", "blue", "green", "yellow"]);

    expect(actor.getSnapshot().value).toBe("won");
    expect(actor.getSnapshot().context.finishedAt).toBeGreaterThan(0);
  });

  it("loses after the last guess", () => {
    const actor = startGame();
    for (let turn = 0; turn < 10; turn++) {
      guess(actor, ["blue", "blue", "blue", "blue"]);
    }

    expect(actor.getSnapshot().value).toBe("lost");
    expect(actor.getSnapshot().context.guesses).toHaveLength(10);
  });

  it("wins on the last guess instead of losing", () => {
    const actor = startGame();
    for (let turn = 0; turn < 9; turn++) {
      guess(actor, ["blue", "blue", "blue", "blue"]);
    }
    guess(actor, ["red", "red", "red", "red"]);

    expect(actor.getSnapshot().value).toBe("won");
  });

  it("NEW_GAME resets and can switch difficulty", () => {
    const actor = startGame();
    guess(actor, ["red", "red", "red", "red"]);
    actor.send({ type: "NEW_GAME", difficulty: "hard" });
    const { value, context } = actor.getSnapshot();

    expect(value).toBe("playing");
    expect(context.difficulty).toBe("hard");
    expect(context.guesses).toHaveLength(0);
    expect(context.current).toHaveLength(5);
    expect(context.startedAt).toBe(0);
  });
});
