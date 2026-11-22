import {
  pickChatLine,
  pickHintLine,
  type BullLine,
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
