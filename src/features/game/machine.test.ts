import { createActor } from "xstate";
import type { Color } from "./logic";
import { AUTO_SUBMIT_DELAY_MS, gameMachine, type GameEmitted } from "./machine";

/* RNG always returning 0 → classic secret is red×4, easy is red/blue/green/yellow. */
function startGame(difficulty: "easy" | "classic" | "hard" = "classic") {
  const actor = createActor(gameMachine, {
    input: { difficulty, randomInt: () => 0 },
  });
  actor.start();

  return actor;
}

function guessPegs(actor: ReturnType<typeof startGame>, colors: Color[]) {
  for (const color of colors) actor.send({ type: "ADD_PEG", color });
}

function guess(actor: ReturnType<typeof startGame>, colors: Color[]) {
  guessPegs(actor, colors);
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

  it("emits rowIncomplete only for a rejected SUBMIT", () => {
    const actor = startGame();
    const onRowIncomplete = vi.fn<() => void>();
    actor.on("rowIncomplete", onRowIncomplete);

    actor.send({ type: "ADD_PEG", color: "blue" });
    actor.send({ type: "SUBMIT" });
    expect(onRowIncomplete).toHaveBeenCalledTimes(1);

    guess(actor, ["blue", "blue", "blue"]);
    expect(onRowIncomplete).toHaveBeenCalledTimes(1);
  });

  it("emits pegPlaced for each peg that lands, not on a full row", () => {
    const actor = startGame();
    const onPegPlaced = vi.fn<(event: GameEmitted) => void>();
    actor.on("pegPlaced", onPegPlaced);

    guess(actor, ["blue", "blue", "blue", "blue"]);
    actor.send({ type: "ADD_PEG", color: "green" });
    expect(onPegPlaced).toHaveBeenLastCalledWith({
      type: "pegPlaced",
      rowNumber: 2,
      slot: 0,
      color: "green",
    });

    guessPegs(actor, ["red", "red", "red"]);
    actor.send({ type: "ADD_PEG", color: "red" });
    expect(onPegPlaced).toHaveBeenCalledTimes(8);
  });

  it("emits pegRemoved only when a peg comes out", () => {
    const actor = startGame();
    const onPegRemoved = vi.fn<(event: GameEmitted) => void>();
    actor.on("pegRemoved", onPegRemoved);

    actor.send({ type: "REMOVE_PEG" });
    actor.send({ type: "CLEAR_SLOT", index: 2 });
    expect(onPegRemoved).not.toHaveBeenCalled();

    guessPegs(actor, ["blue", "green"]);
    actor.send({ type: "CLEAR_SLOT", index: 0 });
    actor.send({ type: "REMOVE_PEG" });
    expect(onPegRemoved.mock.calls).toEqual([
      [{ type: "pegRemoved", rowNumber: 1, slot: 0, color: "blue" }],
      [{ type: "pegRemoved", rowNumber: 1, slot: 1, color: "green" }],
    ]);
  });

  it("emits scored for accepted guesses only, before gameOver", () => {
    const actor = startGame();
    const events: GameEmitted[] = [];
    actor.on("*", (event) => events.push(event));

    actor.send({ type: "SUBMIT" });
    guess(actor, ["red", "blue", "red", "green"]);
    guess(actor, ["red", "red", "red", "red"]);
    expect(events.filter((event) => event.type !== "pegPlaced")).toEqual([
      { type: "rowIncomplete" },
      { type: "scored", black: 2, white: 0 },
      { type: "scored", black: 4, white: 0 },
      { type: "gameOver", isWon: true },
    ]);
  });

  it("emits gameOver as a loss on give up", () => {
    const actor = startGame();
    const onGameOver = vi.fn<(event: GameEmitted) => void>();
    actor.on("gameOver", onGameOver);

    actor.send({ type: "GIVE_UP" });
    expect(onGameOver).toHaveBeenCalledWith({ type: "gameOver", isWon: false });
  });

  describe("auto submit", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    function addPegs(actor: ReturnType<typeof startGame>, colors: Color[]) {
      for (const color of colors) {
        actor.send({ type: "ADD_PEG", color, isAutoSubmit: true });
      }
    }

    it("does nothing when the flag is off", () => {
      const actor = startGame();
      guessPegs(actor, ["blue", "blue", "blue", "blue"]);
      vi.advanceTimersByTime(AUTO_SUBMIT_DELAY_MS);

      expect(actor.getSnapshot().context.guesses).toHaveLength(0);
    });

    it("checks a full row after the delay", () => {
      const actor = startGame();
      addPegs(actor, ["blue", "blue", "blue", "blue"]);

      vi.advanceTimersByTime(AUTO_SUBMIT_DELAY_MS - 1);
      expect(actor.getSnapshot().context.guesses).toHaveLength(0);

      vi.advanceTimersByTime(1);
      expect(actor.getSnapshot().context.guesses).toHaveLength(1);
    });

    it("skips the check, without a shake, if a peg is removed in time", () => {
      const actor = startGame();
      const onRowIncomplete = vi.fn<() => void>();
      actor.on("rowIncomplete", onRowIncomplete);

      addPegs(actor, ["blue", "blue", "blue", "blue"]);
      actor.send({ type: "REMOVE_PEG" });
      vi.advanceTimersByTime(AUTO_SUBMIT_DELAY_MS);

      expect(actor.getSnapshot().context.guesses).toHaveLength(0);
      expect(onRowIncomplete).not.toHaveBeenCalled();
    });

    it("wins when the auto-checked row cracks the code", () => {
      const actor = startGame();
      addPegs(actor, ["red", "red", "red", "red"]);
      vi.advanceTimersByTime(AUTO_SUBMIT_DELAY_MS);

      expect(actor.getSnapshot().value).toBe("won");
    });
  });

  it("edits the current row", () => {
    const actor = startGame();
    guessPegs(actor, ["blue", "green", "yellow"]);
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

  describe("slot targeting", () => {
    function context(actor: ReturnType<typeof startGame>) {
      return actor.getSnapshot().context;
    }

    it("fills left to right by default", () => {
      const actor = startGame();
      expect(context(actor).target).toBe(0);

      guessPegs(actor, ["red", "blue"]);
      expect(context(actor).current).toEqual(["red", "blue", null, null]);
      expect(context(actor).target).toBe(2);
    });

    it("puts the next peg in a selected slot, then wraps to the next gap", () => {
      const actor = startGame();
      guessPegs(actor, ["orange", "yellow"]);
      actor.send({ type: "SELECT_SLOT", index: 3 });
      actor.send({ type: "ADD_PEG", color: "green" });

      expect(context(actor).current).toEqual([
        "orange",
        "yellow",
        null,
        "green",
      ]);
      expect(context(actor).target).toBe(2);
    });

    it("has no target once the row is full, so extra pegs are ignored", () => {
      const actor = startGame();
      guessPegs(actor, ["red", "blue", "green", "yellow"]);
      expect(context(actor).target).toBeNull();

      actor.send({ type: "ADD_PEG", color: "purple" });
      expect(context(actor).current).toEqual([
        "red",
        "blue",
        "green",
        "yellow",
      ]);
    });

    it("replaces a selected peg", () => {
      const actor = startGame();
      const onPegPlaced = vi.fn<(event: GameEmitted) => void>();
      actor.on("pegPlaced", onPegPlaced);
      guessPegs(actor, ["red", "blue", "green", "yellow"]);

      actor.send({ type: "SELECT_SLOT", index: 1 });
      actor.send({ type: "ADD_PEG", color: "purple" });

      expect(context(actor).current).toEqual([
        "red",
        "purple",
        "green",
        "yellow",
      ]);
      expect(context(actor).target).toBeNull();
      expect(onPegPlaced).toHaveBeenLastCalledWith({
        type: "pegPlaced",
        rowNumber: 1,
        slot: 1,
        color: "purple",
      });
    });

    it("undoes the latest placement, not the rightmost peg", () => {
      const actor = startGame();
      actor.send({ type: "SELECT_SLOT", index: 3 });
      actor.send({ type: "ADD_PEG", color: "green" });
      actor.send({ type: "ADD_PEG", color: "red" });

      expect(context(actor).current).toEqual(["red", null, null, "green"]);

      actor.send({ type: "REMOVE_PEG" });
      expect(context(actor).current).toEqual([null, null, null, "green"]);
      expect(context(actor).target).toBe(0);

      actor.send({ type: "REMOVE_PEG" });
      expect(context(actor).current).toEqual([null, null, null, null]);
      expect(context(actor).target).toBe(3);
    });

    it("counts a replaced peg as the latest placement", () => {
      const actor = startGame();
      guessPegs(actor, ["red", "blue", "green"]);
      actor.send({ type: "SELECT_SLOT", index: 0 });
      actor.send({ type: "ADD_PEG", color: "yellow" });
      actor.send({ type: "REMOVE_PEG" });

      expect(context(actor).current).toEqual([null, "blue", "green", null]);
    });

    it("targets a cleared slot", () => {
      const actor = startGame();
      guessPegs(actor, ["red", "blue", "green"]);
      actor.send({ type: "CLEAR_SLOT", index: 1 });

      expect(context(actor).target).toBe(1);
      expect(context(actor).placed).toEqual([0, 2]);
    });

    it("ignores a slot outside the row", () => {
      const actor = startGame();
      actor.send({ type: "SELECT_SLOT", index: 4 });
      actor.send({ type: "SELECT_SLOT", index: -1 });

      expect(context(actor).target).toBe(0);
    });

    it("starts each new row at the first slot", () => {
      const actor = startGame();
      actor.send({ type: "SELECT_SLOT", index: 2 });
      guess(actor, ["blue", "blue", "blue", "blue"]);

      expect(context(actor).target).toBe(0);
      expect(context(actor).placed).toEqual([]);
    });
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
    guess(actor, ["red", "orange", "yellow", "green"]);

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

  it("GIVE_UP ends the game as lost and keeps the guesses", () => {
    const actor = startGame();
    guess(actor, ["blue", "blue", "blue", "blue"]);
    actor.send({ type: "GIVE_UP" });
    const { value, context } = actor.getSnapshot();

    expect(value).toBe("lost");
    expect(context.guesses).toHaveLength(1);
    expect(context.finishedAt).toBeGreaterThan(0);
  });
});
