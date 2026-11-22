import {
  consistentCodes,
  deduceHints,
  newsworthyHintKeys,
  type Hint,
} from "./hints";
import {
  DIFFICULTIES,
  DIFFICULTY_KEYS,
  generateSecret,
  paletteFor,
  scoreGuess,
  type Color,
  type Difficulty,
} from "./logic";
import type { Guess } from "./machine";

const scored = (secret: readonly Color[], pegs: Color[]): Guess => ({
  pegs,
  ...scoreGuess(secret, pegs),
});

/* Seeded LCG so the property test replays the same games every run. */
function seededRandomInt(seed: number) {
  let state = seed;

  return (max: number) => {
    state = (state * 1_103_515_245 + 12_345) % 2_147_483_648;

    return state % max;
  };
}

/* Is the hint true of this code? Every deduced hint must be, for the real secret. */
function isTrueOf(hint: Hint, code: readonly Color[]): boolean {
  switch (hint.kind) {
    case "absent":
    case "rowHasAbsent":
      return !code.includes(hint.color);

    case "present":
      return hint.colors.every((color) => code.includes(color));

    case "slotIs":
      return code[hint.slot - 1] === hint.color;

    case "slotIsNot":
      return code[hint.slot - 1] !== hint.color;

    case "noRepeats":
      return new Set(code).size === code.length;

    case "codesLeft":
    case "oneLeft":
      return true;
  }
}

describe("deduceHints", () => {
  it("says nothing before the first guess", () => {
    expect(deduceHints("classic", [], [])).toEqual([]);
  });

  it("rules out every colour of a guess with no bulls and no cows", () => {
    const [first, second] = paletteFor("classic");
    const guess: Guess = {
      pegs: [first, first, second, second],
      black: 0,
      white: 0,
    };
    const hints = deduceHints("classic", [guess], []);

    expect(hints).toContainEqual({ kind: "absent", color: first });
    expect(hints).toContainEqual({ kind: "absent", color: second });
    expect(hints.filter((hint) => hint.kind === "absent")).toHaveLength(2);
  });

  it("knows the colours but not the order after four cows", () => {
    const palette = paletteFor("classic");
    const pegs = palette.slice(0, 4);
    const hints = deduceHints("classic", [{ pegs, black: 0, white: 4 }], []);

    expect(hints).toContainEqual({ kind: "present", colors: pegs });
    expect(hints).toContainEqual({ kind: "noRepeats" });
    // Zero bulls: no guessed colour sits where it was tried.
    expect(hints).toContainEqual({
      kind: "slotIsNot",
      slot: 1,
      color: pegs[0],
    });
    expect(hints.some((hint) => hint.kind === "slotIs")).toBe(false);
    // 9 derangements of four colours.
    expect(hints).toContainEqual({ kind: "codesLeft", count: 9 });
  });

  it("never says 'no repeats' on Easy, where nothing can repeat", () => {
    const palette = paletteFor("easy");
    const pegs = palette.slice(0, 4);
    const hints = deduceHints("easy", [{ pegs, black: 0, white: 4 }], []);

    expect(hints).not.toContainEqual({ kind: "noRepeats" });
  });

  it("warns about a ruled-out colour already in the row", () => {
    const [first, second, third] = paletteFor("classic");
    const guess: Guess = {
      pegs: [first, first, first, first],
      black: 0,
      white: 0,
    };
    const hints = deduceHints("classic", [guess], [first, null, third, null]);

    expect(hints).toContainEqual({ kind: "rowHasAbsent", color: first });
    expect(hints).not.toContainEqual({ kind: "rowHasAbsent", color: third });
    expect(hints).not.toContainEqual({ kind: "rowHasAbsent", color: second });
  });

  it("stays quiet when one clue settles nothing", () => {
    // Found by search: one bull and no cows on four colours fixes no fact.
    const pegs = paletteFor("classic").slice(0, 4);

    expect(deduceHints("classic", [{ pegs, black: 1, white: 0 }], [])).toEqual(
      [],
    );
  });

  it("says one code is left and fills every slot once the clues pin it", () => {
    const [a, b, c, d] = paletteFor("easy");
    const secret = [a, b, c, d];
    // Neither guess wins, yet together they leave only abcd (found by search).
    const guesses = [
      scored(secret, [d, c, b, a]),
      scored(secret, [d, b, c, a]),
    ];
    const hints = deduceHints("easy", guesses, []);

    expect(hints).toContainEqual({ kind: "oneLeft" });
    expect(hints.some((hint) => hint.kind === "codesLeft")).toBe(false);
    for (const [index, color] of secret.entries()) {
      expect(hints).toContainEqual({ kind: "slotIs", slot: index + 1, color });
    }
  });

  it.each(DIFFICULTY_KEYS)(
    "every hint holds for the real secret on %s",
    (difficulty: Difficulty) => {
      const { pegs } = DIFFICULTIES[difficulty];
      const palette = paletteFor(difficulty);

      for (let seed = 1; seed <= 4; seed++) {
        const randomInt = seededRandomInt(seed);
        const secret = generateSecret(difficulty, randomInt);
        const guesses = Array.from({ length: 3 }, () =>
          scored(
            secret,
            Array.from(
              { length: pegs },
              () => palette[randomInt(palette.length)],
            ),
          ),
        );
        const current = Array.from(
          { length: pegs },
          () => palette[randomInt(palette.length)],
        );

        expect(consistentCodes(difficulty, guesses)).toContainEqual(secret);
        for (const hint of deduceHints(difficulty, guesses, current)) {
          // Wrapped so a failure prints the hint that lied.
          expect({ hint, isTrue: isTrueOf(hint, secret) }).toEqual({
            hint,
            isTrue: true,
          });
        }
      }
    },
  );
});

describe("newsworthyHintKeys", () => {
  it("lights the dot for proven colours, not for slot exclusions or the count", () => {
    const palette = paletteFor("classic");
    const pegs = palette.slice(0, 4);
    const guesses: Guess[] = [{ pegs, black: 0, white: 4 }];
    const keys = newsworthyHintKeys("classic", guesses);

    // Four colours in, two out, no repeats: and nothing else.
    expect(keys).toContain(JSON.stringify({ kind: "present", colors: pegs }));
    expect(keys).toContain(JSON.stringify({ kind: "noRepeats" }));
    expect(keys).toHaveLength(4);
    // The same clues give many more facts in the bubble itself.
    expect(deduceHints("classic", guesses, []).length).toBeGreaterThan(4);
  });
});
