import { DIFFICULTIES } from "@/features/game/logic";
import { DAILY_DIFFICULTY } from "./daily";
import { summarize, useDailyResults, type DailyResult } from "./store";

const win = (guesses = 4): DailyResult => ({
  isWon: true,
  guesses,
  elapsedMs: 60_000,
});

const loss: DailyResult = {
  isWon: false,
  guesses: DIFFICULTIES[DAILY_DIFFICULTY].maxGuesses,
  elapsedMs: 60_000,
};

/* Records through the store, then reads the stats as the panel does. */
function summaryAfter(days: Record<number, DailyResult>, today: number) {
  for (const [day, result] of Object.entries(days)) {
    useDailyResults.getState().record(Number(day), result);
  }

  return summarize(useDailyResults.getState().results, today);
}

beforeEach(() => {
  localStorage.clear();
  useDailyResults.setState(useDailyResults.getInitialState(), true);
});

describe("daily stats", () => {
  it("starts a new player at zero", () => {
    expect(summaryAfter({}, 1)).toMatchObject({
      played: 0,
      won: 0,
      currentStreak: 0,
      bestStreak: 0,
    });
  });

  it("counts today's win in the streak", () => {
    const summary = summaryAfter({ 3: win(), 4: win(), 5: win() }, 5);

    expect(summary.currentStreak).toBe(3);
  });

  it("keeps the streak alive while today is still unplayed", () => {
    const summary = summaryAfter({ 3: win(), 4: win() }, 5);

    expect(summary.currentStreak).toBe(2);
  });

  it("ends the streak after a missed day", () => {
    expect(summaryAfter({ 3: win(), 4: win() }, 6).currentStreak).toBe(0);
  });

  it("starts the streak again after a gap", () => {
    const summary = summaryAfter({ 1: win(), 2: win(), 4: win() }, 4);

    expect(summary.currentStreak).toBe(1);
  });

  it("ends the streak on a loss", () => {
    expect(summaryAfter({ 3: win(), 4: loss }, 4).currentStreak).toBe(0);
  });

  it("remembers the best streak after it ends", () => {
    const summary = summaryAfter(
      { 1: win(), 2: win(), 3: win(), 4: loss, 5: win(), 6: win() },
      6,
    );

    expect(summary.bestStreak).toBe(3);
    expect(summary.currentStreak).toBe(2);
  });

  it("counts played days and wins separately", () => {
    const summary = summaryAfter({ 1: win(), 2: loss, 3: win() }, 3);

    expect(summary.played).toBe(3);
    expect(summary.won).toBe(2);
  });

  it("spreads wins by guess count and leaves losses out", () => {
    const { distribution } = summaryAfter(
      { 1: win(3), 2: win(3), 3: win(5), 4: loss },
      4,
    );

    expect(distribution).toHaveLength(
      DIFFICULTIES[DAILY_DIFFICULTY].maxGuesses,
    );
    // Index 0 is a first-guess win.
    expect(distribution[2]).toBe(2);
    expect(distribution[4]).toBe(1);
    expect(distribution.reduce((sum, wins) => sum + wins, 0)).toBe(3);
  });

  it("keeps a day's first result: one attempt per code", () => {
    const { record } = useDailyResults.getState();
    record(7, loss);
    record(7, win());

    expect(useDailyResults.getState().results[7]).toEqual(loss);
  });
});
