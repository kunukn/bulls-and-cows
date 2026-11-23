import {
  pickChatLine,
  pickDailyLine,
  pickHintLine,
  type BullLine,
  type DailySituation,
  type DailyStats,
  type HintSituation,
} from "./bullLines";
import { paletteFor, type Color, type RandomInt } from "./logic";
import type { Guess } from "./machine";

const [a, b, c, d] = paletteFor("classic");
const emptyRow: (Color | null)[] = [null, null, null, null];

/* All four colours right, none in its place: plenty of facts to tell. */
const fourCows: Guess = { pegs: [a, b, c, d], black: 0, white: 4 };

// Two bulls, no cows on four colours: settles no fact (see hints.test.ts).
const silentGuess: Guess = { pegs: [a, b, c, d], black: 2, white: 0 };

const hintSituation = (overrides: Partial<HintSituation>): HintSituation => ({
  difficulty: "classic",
  guesses: [],
  current: emptyRow,
  ...overrides,
});

/* Every line a picker could say, by trying each pair of random choices. */
function allLines(pick: (randomInt: RandomInt) => BullLine): BullLine[] {
  const lines: BullLine[] = [];
  for (let group = 0; group < 20; group++) {
    for (let item = 0; item < 20; item++) {
      const choices = [group, item];
      lines.push(pick((max) => (choices.shift() ?? 0) % max));
    }
  }

  return lines;
}

const keysOf = (lines: BullLine[]) =>
  lines.map((line) => (line.kind === "static" ? line.key : line.kind));

const kindOf = (line: BullLine) =>
  line.kind === "hint" ? line.hint.kind : line.kind;

describe("pickChatLine (the header bull)", () => {
  it("only chats while a game is in play: no tips, no hints", () => {
    const keys = keysOf(
      allLines((randomInt) =>
        pickChatLine({ isPlayPage: true, status: "playing" }, null, randomInt),
      ),
    );

    expect(keys.every((key) => key.startsWith("bull.quips."))).toBe(true);
  });

  it.each(["won", "lost"] as const)(
    "has a word for a %s game on the play page",
    (status) => {
      const keys = keysOf(
        allLines((randomInt) =>
          pickChatLine({ isPlayPage: true, status }, null, randomInt),
        ),
      );

      expect(keys.some((key) => key.startsWith(`bull.${status}.`))).toBe(true);
    },
  );

  it("doesn't bring up the finished game on the high-score page", () => {
    const keys = keysOf(
      allLines((randomInt) =>
        pickChatLine({ isPlayPage: false, status: "won" }, null, randomInt),
      ),
    );

    expect(keys.every((key) => key.startsWith("bull.quips."))).toBe(true);
  });

  it("never repeats the previous line when there's another to say", () => {
    const alwaysFirst: RandomInt = () => 0;
    const situation = { isPlayPage: true, status: "playing" } as const;
    const previous = pickChatLine(situation, null, alwaysFirst);

    expect(pickChatLine(situation, previous, alwaysFirst)).not.toEqual(
      previous,
    );
  });
});

describe("pickHintLine (the shield bull)", () => {
  it("gives general tips before the first guess, never small talk", () => {
    const keys = keysOf(
      allLines((randomInt) => pickHintLine(hintSituation({}), null, randomInt)),
    );

    expect(keys.every((key) => key.startsWith("bull.tips."))).toBe(true);
  });

  it("gives only deductions once the clues settle something", () => {
    const lines = allLines((randomInt) =>
      pickHintLine(hintSituation({ guesses: [fourCows] }), null, randomInt),
    );

    expect(lines.every((line) => line.kind === "hint")).toBe(true);
    expect(lines).toContainEqual({ kind: "hint", hint: { kind: "noRepeats" } });
  });

  it("says there aren't enough clues when nothing is settled", () => {
    const situation = hintSituation({ guesses: [silentGuess] });
    const previous = pickHintLine(situation, null);

    expect(previous).toEqual({ kind: "noClues" });
    // The only line there is, so it may repeat.
    expect(pickHintLine(situation, previous)).toEqual({ kind: "noClues" });
  });

  it("gives each kind of fact a fair chance, however many of one kind", () => {
    // Four zero-bull cows leave four 'slot can't be' facts, but one 'present'.
    const situation = hintSituation({ guesses: [fourCows] });
    const kinds: string[] = [];
    // The first random draw picks the group, the second the line within it.
    for (let draw = 0; draw < 5; draw++) {
      const choices = [draw, 0];
      const line = pickHintLine(
        situation,
        null,
        (max) => (choices.shift() ?? 0) % max,
      );
      kinds.push(kindOf(line));
    }

    // Five draws, five different kinds: one kind can't crowd out the rest.
    expect(new Set(kinds)).toEqual(
      new Set(["absent", "present", "slotIsNot", "noRepeats", "codesLeft"]),
    );
  });

  it("leads with the row being built, then alternates with board facts", () => {
    // Slot 1 can't be a: the fact the player can act on right now.
    const situation = hintSituation({
      guesses: [fourCows],
      current: [a, null, null, null],
    });
    const first = pickHintLine(situation, null);
    const second = pickHintLine(situation, first);
    const third = pickHintLine(situation, second);

    expect(kindOf(first)).toBe("rowSlotWrong");
    expect(kindOf(second)).not.toMatch(/^row/);
    expect(kindOf(third)).toBe("rowSlotWrong");
  });
});

const NEW_PLAYER: DailyStats = {
  played: 0,
  won: 0,
  bestStreak: 0,
  distribution: [],
};

const dailySituation = (stats: DailyStats): DailySituation => ({
  dailyNumber: 3,
  msUntilNext: 5 * 3_600_000,
  stats,
});

const dailyFactsOf = (lines: BullLine[]) =>
  lines.flatMap((line) => (line.kind === "daily" ? [line.fact] : []));

describe("pickDailyLine (the shield bull on the daily code)", () => {
  it("never tips or deduces: everyone solves the shared code alone", () => {
    const lines = allLines((randomInt) =>
      pickDailyLine(dailySituation(NEW_PLAYER), null, randomInt),
    );

    expect(lines.some((line) => line.kind === "hint")).toBe(false);
    expect(lines.some((line) => line.kind === "noClues")).toBe(false);
    expect(keysOf(lines).some((key) => key.startsWith("bull.tips."))).toBe(
      false,
    );
  });

  it("tells a new player how the day works, and calms them down", () => {
    const lines = allLines((randomInt) =>
      pickDailyLine(dailySituation(NEW_PLAYER), null, randomInt),
    );
    const keys = keysOf(lines);

    expect(keys.some((key) => key.startsWith("bull.calm."))).toBe(true);
    expect(dailyFactsOf(lines)).toContainEqual({
      kind: "nextCode",
      msUntilNext: 5 * 3_600_000,
    });
    expect(dailyFactsOf(lines)).toContainEqual({
      kind: "seed",
      dailyNumber: 3,
    });
    // Classic: 6 colours in 4 slots.
    expect(dailyFactsOf(lines)).toContainEqual({
      kind: "codeCount",
      codes: 1296,
    });
  });

  it("has no stats of yours before your first finished day", () => {
    const kinds = dailyFactsOf(
      allLines((randomInt) =>
        pickDailyLine(dailySituation(NEW_PLAYER), null, randomInt),
      ),
    ).map((fact) => fact.kind);

    expect(kinds).not.toContain("wins");
    expect(kinds).not.toContain("averageWin");
    expect(kinds).not.toContain("bestStreak");
  });

  it("averages your wins by guesses, after you've played", () => {
    // Won in 3 and in 5 guesses, lost once.
    const stats: DailyStats = {
      played: 3,
      won: 2,
      bestStreak: 1,
      distribution: [0, 0, 1, 0, 1, 0, 0, 0, 0, 0],
    };
    const facts = dailyFactsOf(
      allLines((randomInt) =>
        pickDailyLine(dailySituation(stats), null, randomInt),
      ),
    );

    expect(facts).toContainEqual({ kind: "wins", won: 2, played: 3 });
    expect(facts).toContainEqual({ kind: "averageWin", guesses: 4 });
    expect(facts).toContainEqual({ kind: "bestStreak", days: 1 });
  });

  it("has no average while every day so far was lost", () => {
    const stats: DailyStats = { ...NEW_PLAYER, played: 2 };
    const kinds = dailyFactsOf(
      allLines((randomInt) =>
        pickDailyLine(dailySituation(stats), null, randomInt),
      ),
    ).map((fact) => fact.kind);

    expect(kinds).toContain("wins");
    expect(kinds).not.toContain("averageWin");
  });

  it("doesn't repeat the countdown just because its time moved on", () => {
    // Draws: group 1 (how the day works), then line 5 in it, the countdown.
    const draws =
      (...choices: number[]): RandomInt =>
      (max) =>
        (choices.shift() ?? 0) % max;
    const first = pickDailyLine(dailySituation(NEW_PLAYER), null, draws(1, 5));
    expect(first).toMatchObject({ kind: "daily", fact: { kind: "nextCode" } });

    const aMinuteLeft = { ...dailySituation(NEW_PLAYER), msUntilNext: 60_000 };
    const second = pickDailyLine(aMinuteLeft, first, draws(1, 5));

    expect(second).not.toMatchObject({
      kind: "daily",
      fact: { kind: "nextCode" },
    });
  });
});
