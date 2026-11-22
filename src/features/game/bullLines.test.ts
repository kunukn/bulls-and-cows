import { pickBullLine, type BullLine, type BullSituation } from "./bullLines";
import { paletteFor, type RandomInt } from "./logic";
import type { Guess } from "./machine";

const palette = paletteFor("classic");
const [first, second] = palette;
const emptyRow = [null, null, null, null];

// Rules out two colours: a clue the bull can always turn into a hint.
const revealingGuess: Guess = {
  pegs: [first, first, second, second],
  black: 0,
  white: 0,
};

// One bull, no cows on four colours: settles no fact (see hints.test.ts).
const silentGuess: Guess = {
  pegs: palette.slice(0, 4),
  black: 1,
  white: 0,
};

const situation = (overrides: Partial<BullSituation>): BullSituation => ({
  isPlayPage: true,
  status: "playing",
  difficulty: "classic",
  guesses: [],
  current: emptyRow,
  ...overrides,
});

/* Every line the bull could say here, by trying each random choice. */
function allLines(state: BullSituation): BullLine[] {
  const lines: BullLine[] = [];
  for (let group = 0; group < 20; group++) {
    for (let item = 0; item < 20; item++) {
      const choices = [group, item];
      const randomInt: RandomInt = (max) => (choices.shift() ?? 0) % max;
      lines.push(pickBullLine(state, null, randomInt));
    }
  }

  return lines;
}

const keysOf = (lines: BullLine[]) =>
  lines.map((line) => (line.kind === "static" ? line.key : line.kind));

describe("pickBullLine", () => {
  it("only chats on the high-score page, even mid-game", () => {
    const keys = keysOf(
      allLines(situation({ isPlayPage: false, guesses: [revealingGuess] })),
    );

    expect(keys.every((key) => key.startsWith("bull.quips."))).toBe(true);
  });

  it("gives a deduced hint once the clues settle something", () => {
    const lines = allLines(situation({ guesses: [revealingGuess] }));

    expect(lines.every((line) => line.kind === "hint")).toBe(true);
    expect(lines).toContainEqual({
      kind: "hint",
      hint: { kind: "absent", color: first },
    });
  });

  it("says there aren't enough clues when nothing is settled", () => {
    expect(allLines(situation({ guesses: [silentGuess] }))).toContainEqual({
      kind: "noClues",
    });
  });

  it("offers tips before the first guess, never a no-clues line", () => {
    const keys = keysOf(allLines(situation({})));

    expect(keys.some((key) => key.startsWith("bull.tips."))).toBe(true);
    expect(keys).not.toContain("noClues");
  });

  it.each(["won", "lost"] as const)(
    "after a %s game, never hints about the finished board",
    (status) => {
      const keys = keysOf(
        allLines(situation({ status, guesses: [revealingGuess] })),
      );

      expect(keys.some((key) => key.startsWith(`bull.${status}.`))).toBe(true);
      expect(keys).not.toContain("hint");
      expect(keys.some((key) => key.startsWith("bull.tips."))).toBe(false);
    },
  );

  it("never repeats the previous line when there's another to say", () => {
    const alwaysFirst: RandomInt = () => 0;
    const state = situation({ isPlayPage: false });
    const previous = pickBullLine(state, null, alwaysFirst);

    expect(pickBullLine(state, previous, alwaysFirst)).not.toEqual(previous);
  });

  it("repeats the only line rather than say nothing", () => {
    const state = situation({ guesses: [silentGuess] });
    const previous = pickBullLine(state, null);

    expect(pickBullLine(state, previous)).toEqual({ kind: "noClues" });
  });

  it("gives each kind of hint a fair chance, however many of one kind", () => {
    // Four zero-bull cows leave many 'slot can't be' facts, but one 'present'.
    const pegs = palette.slice(0, 4);
    const state = situation({ guesses: [{ pegs, black: 0, white: 4 }] });
    const kinds: string[] = [];
    // The first random draw picks the group, the second the line within it.
    for (let draw = 0; draw < 5; draw++) {
      const choices = [draw, 0];
      const line = pickBullLine(
        state,
        null,
        (max) => (choices.shift() ?? 0) % max,
      );
      if (line.kind === "hint") kinds.push(line.hint.kind);
    }

    // Five draws, five different kinds: one kind can't crowd out the rest.
    expect(new Set(kinds)).toEqual(
      new Set(["absent", "present", "slotIsNot", "noRepeats", "codesLeft"]),
    );
  });
});
