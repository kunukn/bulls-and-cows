import { createActor } from "xstate";
import { consistentCodes, DIFFICULTIES, paletteFor, type Color } from "./logic";
import { AUTO_SUBMIT_DELAY_MS, gameMachine, type GameEmitted } from "./machine";

/*
 * RNG always returning 0 → classic secret is red×4, easy is
 * red/orange/yellow/green. Misses use cyan: in every palette, never in red×4.
 */
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
    actor.send({ type: "ADD_PEG", color: "cyan" });
    actor.send({ type: "SUBMIT" });

    expect(actor.getSnapshot().context.guesses).toHaveLength(0);
    expect(actor.getSnapshot().context.current).toEqual([
      "cyan",
      null,
      null,
      null,
    ]);
  });

  it("emits rowIncomplete only for a rejected SUBMIT", () => {
    const actor = startGame();
    const onRowIncomplete = vi.fn<() => void>();
    actor.on("rowIncomplete", onRowIncomplete);

    actor.send({ type: "ADD_PEG", color: "cyan" });
    actor.send({ type: "SUBMIT" });
    expect(onRowIncomplete).toHaveBeenCalledTimes(1);

    guess(actor, ["cyan", "cyan", "cyan"]);
    expect(onRowIncomplete).toHaveBeenCalledTimes(1);
  });

  it("emits pegPlaced for each peg that lands, not on a full row", () => {
    const actor = startGame();
    const onPegPlaced = vi.fn<(event: GameEmitted) => void>();
    actor.on("pegPlaced", onPegPlaced);

    guess(actor, ["cyan", "cyan", "cyan", "cyan"]);
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

    guessPegs(actor, ["cyan", "green"]);
    actor.send({ type: "CLEAR_SLOT", index: 0 });
    actor.send({ type: "REMOVE_PEG" });
    expect(onPegRemoved.mock.calls).toEqual([
      [{ type: "pegRemoved", rowNumber: 1, slot: 0, color: "cyan" }],
      [{ type: "pegRemoved", rowNumber: 1, slot: 1, color: "green" }],
    ]);
  });

  it("emits scored for accepted guesses only, before gameOver", () => {
    const actor = startGame();
    const events: GameEmitted[] = [];
    actor.on("*", (event) => events.push(event));

    actor.send({ type: "SUBMIT" });
    guess(actor, ["red", "cyan", "red", "green"]);
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
      guessPegs(actor, ["cyan", "cyan", "cyan", "cyan"]);
      vi.advanceTimersByTime(AUTO_SUBMIT_DELAY_MS);

      expect(actor.getSnapshot().context.guesses).toHaveLength(0);
    });

    it("checks a full row after the delay", () => {
      const actor = startGame();
      addPegs(actor, ["cyan", "cyan", "cyan", "cyan"]);

      vi.advanceTimersByTime(AUTO_SUBMIT_DELAY_MS - 1);
      expect(actor.getSnapshot().context.guesses).toHaveLength(0);

      vi.advanceTimersByTime(1);
      expect(actor.getSnapshot().context.guesses).toHaveLength(1);
    });

    it("skips the check, without a shake, if a peg is removed in time", () => {
      const actor = startGame();
      const onRowIncomplete = vi.fn<() => void>();
      actor.on("rowIncomplete", onRowIncomplete);

      addPegs(actor, ["cyan", "cyan", "cyan", "cyan"]);
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
    guessPegs(actor, ["cyan", "green", "yellow"]);
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

      guessPegs(actor, ["red", "cyan"]);
      expect(context(actor).current).toEqual(["red", "cyan", null, null]);
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
      guessPegs(actor, ["red", "cyan", "green", "yellow"]);
      expect(context(actor).target).toBeNull();

      actor.send({ type: "ADD_PEG", color: "purple" });
      expect(context(actor).current).toEqual([
        "red",
        "cyan",
        "green",
        "yellow",
      ]);
    });

    it("replaces a selected peg", () => {
      const actor = startGame();
      const onPegPlaced = vi.fn<(event: GameEmitted) => void>();
      actor.on("pegPlaced", onPegPlaced);
      guessPegs(actor, ["red", "cyan", "green", "yellow"]);

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
      guessPegs(actor, ["red", "cyan", "green"]);
      actor.send({ type: "SELECT_SLOT", index: 0 });
      actor.send({ type: "ADD_PEG", color: "yellow" });
      actor.send({ type: "REMOVE_PEG" });

      expect(context(actor).current).toEqual([null, "cyan", "green", null]);
    });

    it("targets a cleared slot", () => {
      const actor = startGame();
      guessPegs(actor, ["red", "cyan", "green"]);
      actor.send({ type: "CLEAR_SLOT", index: 1 });

      expect(context(actor).target).toBe(1);

      // The cleared peg leaves the undo history: two undos empty the row.
      actor.send({ type: "REMOVE_PEG" });
      actor.send({ type: "REMOVE_PEG" });
      expect(context(actor).current).toEqual([null, null, null, null]);
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
      guess(actor, ["cyan", "cyan", "cyan", "cyan"]);

      expect(context(actor).target).toBe(0);

      // Undo has nothing to take back from the previous row.
      actor.send({ type: "REMOVE_PEG" });
      expect(context(actor).target).toBe(0);
    });
  });

  it("scores a guess and starts the clock", () => {
    const actor = startGame();
    guess(actor, ["red", "cyan", "red", "green"]);
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
    const { maxGuesses } = DIFFICULTIES.classic;
    const actor = startGame();
    for (let turn = 0; turn < maxGuesses; turn++) {
      guess(actor, ["cyan", "cyan", "cyan", "cyan"]);
    }

    expect(actor.getSnapshot().value).toBe("lost");
    expect(actor.getSnapshot().context.guesses).toHaveLength(maxGuesses);
  });

  it("wins on the last guess instead of losing", () => {
    const actor = startGame();
    for (let turn = 0; turn < DIFFICULTIES.classic.maxGuesses - 1; turn++) {
      guess(actor, ["cyan", "cyan", "cyan", "cyan"]);
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
    guess(actor, ["cyan", "cyan", "cyan", "cyan"]);
    actor.send({ type: "GIVE_UP" });
    const { value, context } = actor.getSnapshot();

    expect(value).toBe("lost");
    expect(context.guesses).toHaveLength(1);
    expect(context.finishedAt).toBeGreaterThan(0);
  });
});

/*
 * A daily game on day 1, dealt red×4 like startGame. The next day's RNG
 * always returns 1, so its code is the palette's second colour ×4.
 */
describe("gameMachine, daily game", () => {
  const nextColor = paletteFor("classic")[1];
  const nextDay = {
    type: "NEXT_DAILY",
    dailyNumber: 2,
    randomInt: () => 1,
  } as const;

  function startDaily() {
    return createActor(gameMachine, {
      input: { difficulty: "classic", randomInt: () => 0, dailyNumber: 1 },
    }).start();
  }

  it("ignores NEW_GAME: a daily code gets one attempt", () => {
    const actor = startDaily();
    guess(actor, ["red", "red", "red", "red"]);
    actor.send({ type: "NEW_GAME" });
    const { value, context } = actor.getSnapshot();

    expect(value).toBe("won");
    expect(context.guesses).toHaveLength(1);
  });

  it("moves on to a later day's code once the game is over", () => {
    const actor = startDaily();
    guess(actor, ["cyan", "cyan", "cyan", "cyan"]);
    actor.send({ type: "GIVE_UP" });
    actor.send(nextDay);
    const { value, context } = actor.getSnapshot();

    expect(value).toBe("playing");
    expect(context.dailyNumber).toBe(2);
    expect(context.secret).toEqual(
      Array(DIFFICULTIES.classic.pegs).fill(nextColor),
    );
    expect(context.guesses).toHaveLength(0);
    expect(context.startedAt).toBe(0);

    // Still a daily game: the new day gets one attempt too.
    guess(actor, Array(DIFFICULTIES.classic.pegs).fill(nextColor));
    actor.send({ type: "NEW_GAME" });
    expect(actor.getSnapshot().value).toBe("won");
  });

  it("moves an untouched board on to a later day", () => {
    const actor = startDaily();
    actor.send(nextDay);

    expect(actor.getSnapshot().context.dailyNumber).toBe(2);
  });

  it("never replaces a game under way", () => {
    const actor = startDaily();
    actor.send({ type: "ADD_PEG", color: "cyan" });
    actor.send(nextDay);
    const { context } = actor.getSnapshot();

    expect(context.dailyNumber).toBe(1);
    expect(context.current[0]).toBe("cyan");
  });

  it("ignores the same or an earlier day", () => {
    const actor = startDaily();
    actor.send({ type: "GIVE_UP" });
    actor.send({ ...nextDay, dailyNumber: 1 });
    actor.send({ ...nextDay, dailyNumber: 0 });

    expect(actor.getSnapshot().value).toBe("lost");
    expect(actor.getSnapshot().context.dailyNumber).toBe(1);
  });

  it("is ignored by a practice game", () => {
    const actor = startGame();
    actor.send({ type: "GIVE_UP" });
    actor.send(nextDay);

    expect(actor.getSnapshot().value).toBe("lost");
    expect(actor.getSnapshot().context.dailyNumber).toBeNull();
  });
});

describe("gameMachine, swap mode (0013)", () => {
  function startSwapGame() {
    return createActor(gameMachine, {
      input: { difficulty: "classic", randomInt: () => 0, isSwapMode: true },
    }).start();
  }

  it("doesn't let a first-guess hit win", () => {
    const actor = startSwapGame();
    // Dealt red×4, but 625 codes have no red in the right spot.
    guess(actor, ["red", "red", "red", "red"]);
    const { value, context } = actor.getSnapshot();

    expect(value).toBe("playing");
    expect(context.guesses[0]).toMatchObject({ black: 0, white: 0 });
  });

  it("keeps a code that fits every row shown", () => {
    const actor = startSwapGame();
    const rows: Color[][] = [
      ["red", "red", "orange", "orange"],
      ["yellow", "yellow", "green", "green"],
      ["cyan", "purple", "red", "orange"],
    ];
    for (const pegs of rows) guess(actor, pegs);
    const { context } = actor.getSnapshot();

    expect(consistentCodes("classic", context.guesses)).toContainEqual(
      context.secret,
    );
  });

  it("carries the mode into a new game, or changes it when asked", () => {
    const actor = startSwapGame();
    actor.send({ type: "NEW_GAME" });
    expect(actor.getSnapshot().context.isSwapMode).toBe(true);

    actor.send({ type: "NEW_GAME", isSwapMode: false });
    expect(actor.getSnapshot().context.isSwapMode).toBe(false);
  });

  it("never swaps a daily code", () => {
    const actor = createActor(gameMachine, {
      input: {
        difficulty: "classic",
        randomInt: () => 0,
        dailyNumber: 1,
        isSwapMode: true,
      },
    }).start();
    guess(actor, ["red", "red", "red", "red"]);

    expect(actor.getSnapshot().value).toBe("won");
  });
});
