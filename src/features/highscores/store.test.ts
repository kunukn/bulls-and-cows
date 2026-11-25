import {
  MAX_ENTRIES,
  qualifies,
  useHighScores,
  type HighScoreEntry,
} from "./store";

function entry(overrides: Partial<HighScoreEntry>): HighScoreEntry {
  return {
    id: Math.random(),
    name: "Ada",
    guesses: 5,
    elapsedMs: 60_000,
    achievedAt: 1,
    ...overrides,
  };
}

beforeEach(() => {
  useHighScores.getState().clear();
});

describe("high scores", () => {
  it("ranks by guesses, then time", () => {
    const { addEntry } = useHighScores.getState();
    addEntry("classic", entry({ name: "slow", guesses: 4, elapsedMs: 90_000 }));
    addEntry("classic", entry({ name: "more", guesses: 6, elapsedMs: 10_000 }));
    addEntry("classic", entry({ name: "fast", guesses: 4, elapsedMs: 30_000 }));

    const names = useHighScores.getState().scores.classic.map((e) => e.name);

    expect(names).toEqual(["fast", "slow", "more"]);
  });

  it("keeps difficulties separate", () => {
    useHighScores.getState().addEntry("hard", entry({}));

    expect(useHighScores.getState().scores.hard).toHaveLength(1);
    expect(useHighScores.getState().scores.classic).toHaveLength(0);
  });

  it("keeps swap-mode wins on their own board (0013)", () => {
    useHighScores.getState().addEntry("classic", entry({}), true);

    expect(useHighScores.getState().swapScores.classic).toHaveLength(1);
    expect(useHighScores.getState().scores.classic).toHaveLength(0);
  });

  it("gives a save from before swap mode an empty swap board", async () => {
    localStorage.setItem(
      "app:highscores",
      JSON.stringify({
        state: { scores: { easy: [], classic: [entry({})], hard: [] } },
        version: 1,
      }),
    );

    await useHighScores.persist.rehydrate();

    expect(useHighScores.getState().scores.classic).toHaveLength(1);
    expect(useHighScores.getState().swapScores.classic).toEqual([]);
  });

  it("truncates to the top entries", () => {
    const { addEntry } = useHighScores.getState();
    for (let index = 0; index < MAX_ENTRIES + 3; index++) {
      addEntry("easy", entry({ guesses: index + 1 }));
    }
    const entries = useHighScores.getState().scores.easy;

    expect(entries).toHaveLength(MAX_ENTRIES);
    expect(entries.at(-1)?.guesses).toBe(MAX_ENTRIES);
  });

  it("ignores a duplicate run id", () => {
    const { addEntry } = useHighScores.getState();
    addEntry("easy", entry({ id: 42 }));
    addEntry("easy", entry({ id: 42 }));

    expect(useHighScores.getState().scores.easy).toHaveLength(1);
  });

  it("qualifies only runs that beat the worst of a full board", () => {
    const full = Array.from({ length: MAX_ENTRIES }, () =>
      entry({ guesses: 5, elapsedMs: 60_000 }),
    );

    expect(qualifies([], { guesses: 10, elapsedMs: 1 })).toBe(true);
    expect(qualifies(full, { guesses: 4, elapsedMs: 99_000 })).toBe(true);
    expect(qualifies(full, { guesses: 5, elapsedMs: 59_000 })).toBe(true);
    expect(qualifies(full, { guesses: 5, elapsedMs: 60_000 })).toBe(false);
    expect(qualifies(full, { guesses: 6, elapsedMs: 1 })).toBe(false);
  });
});
