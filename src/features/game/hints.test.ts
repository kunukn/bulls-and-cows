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

const [a, b, c, d, e, f] = paletteFor("classic");

const scored = (secret: readonly Color[], pegs: Color[]): Guess => ({
  pegs,
  ...scoreGuess(secret, pegs),
});

/* All four colours right, none in its place: the code is a reshuffle of abcd. */
const fourCows: Guess[] = [{ pegs: [a, b, c, d], black: 0, white: 4 }];

/* Seeded LCG so the property test replays the same games every run. */
function seededRandomInt(seed: number) {
  let state = seed;

  return (max: number) => {
    state = (state * 1_103_515_245 + 12_345) % 2_147_483_648;

    return state % max;
  };
}

const countOf = (code: readonly Color[], color: Color) =>
  code.filter((peg) => peg === color).length;

/*
 * Is the hint true when `code` is the secret and `row` the row being built?
 * Every deduced hint must be. "Fits your clues" lines say nothing about the
 * secret itself, so they can't be wrong here.
 */
function isTrueOf(
  hint: Hint,
  code: readonly Color[],
  row: readonly (Color | null)[],
): boolean {
  switch (hint.kind) {
    case "absent":
    case "rowHasAbsent":
      return !code.includes(hint.color);

    case "present":
      return hint.colors.every((color) => code.includes(color));

    case "exactly":
      return countOf(code, hint.color) === hint.count;

    case "atLeast":
      return countOf(code, hint.color) >= hint.count;

    case "atMostOne":
      return countOf(code, hint.color) <= 1;

    case "slotIs":
      return code[hint.slot - 1] === hint.color;

    case "slotIsOneOf":
      return hint.colors.includes(code[hint.slot - 1]);

    case "slotIsNot":
    case "rowSlotWrong":
      return code[hint.slot - 1] !== hint.color;

    case "colorInSlots":
      return code.every(
        (peg, index) => peg !== hint.color || hint.slots.includes(index + 1),
      );

    case "noRepeats":
      return new Set(code).size === code.length;

    case "hasRepeat":
      return new Set(code).size < code.length;

    case "rowConflict":
    case "rowNoFit":
      return row.some((peg, index) => peg !== null && peg !== code[index]);

    case "rowFits":
    case "rowFitsSoFar":
    case "codesLeft":
    case "oneLeft":
      return true;
  }
}

describe("deduceHints: the board", () => {
  it("says nothing before the first guess", () => {
    expect(deduceHints("classic", [], [])).toEqual([]);
  });

  it("rules out every colour of a guess with no bulls and no cows", () => {
    const guess: Guess = { pegs: [a, a, b, b], black: 0, white: 0 };
    const hints = deduceHints("classic", [guess], []);

    expect(hints).toContainEqual({ kind: "absent", color: a });
    expect(hints).toContainEqual({ kind: "absent", color: b });
    expect(hints.filter((hint) => hint.kind === "absent")).toHaveLength(2);
  });

  it("knows the colours but not the order after four cows", () => {
    const hints = deduceHints("classic", fourCows, []);

    expect(hints).toContainEqual({ kind: "present", colors: [a, b, c, d] });
    expect(hints).toContainEqual({ kind: "noRepeats" });
    // Zero bulls: no guessed colour sits where it was tried.
    expect(hints).toContainEqual({ kind: "slotIsNot", slot: 1, color: a });
    expect(hints.some((hint) => hint.kind === "slotIs")).toBe(false);
    // 9 derangements of four colours.
    expect(hints).toContainEqual({ kind: "codesLeft", count: 9 });
  });

  it("doesn't count pegs once the code is proven repeat-free", () => {
    // "Exactly one red" would only restate "red is in" plus "no repeats".
    const kinds = deduceHints("classic", fourCows, []).map((hint) => hint.kind);

    expect(kinds).not.toContain("exactly");
    expect(kinds).not.toContain("atMostOne");
  });

  it("never says 'no repeats' or counts pegs on Easy, where nothing repeats", () => {
    const pegs = paletteFor("easy").slice(0, 4);
    const kinds = deduceHints("easy", [{ pegs, black: 0, white: 4 }], []).map(
      (hint) => hint.kind,
    );

    expect(kinds).not.toContain("noRepeats");
    expect(kinds).not.toContain("exactly");
  });

  it("counts a colour exactly: two bulls on four reds means two reds", () => {
    const hints = deduceHints(
      "classic",
      [{ pegs: [a, a, a, a], black: 2, white: 0 }],
      [],
    );

    expect(hints).toContainEqual({ kind: "exactly", color: a, count: 2 });
    expect(hints).toContainEqual({ kind: "hasRepeat" });
  });

  it("says 'at least two' when two are proven and more are possible", () => {
    // b is out, so both bulls of aabb are the two a's; slots 3 and 4 are open.
    const hints = deduceHints(
      "classic",
      [
        { pegs: [b, b, b, b], black: 0, white: 0 },
        { pegs: [a, a, b, b], black: 2, white: 0 },
      ],
      [],
    );

    expect(hints).toContainEqual({ kind: "atLeast", color: a, count: 2 });
    expect(hints).toContainEqual({ kind: "slotIs", slot: 1, color: a });
    expect(hints.some((hint) => hint.kind === "exactly")).toBe(false);
  });

  it("caps a colour at one: a single match on a doubled colour", () => {
    // Two of a colour in the code would have matched both pegs of it.
    const hints = deduceHints(
      "classic",
      [{ pegs: [a, a, b, b], black: 1, white: 0 }],
      [],
    );

    expect(hints).toContainEqual({ kind: "atMostOne", color: a });
    expect(hints).toContainEqual({ kind: "atMostOne", color: b });
  });

  it("proves a repeat by counting: one of four colours, in four slots", () => {
    // Only one of abcd is in, so the code is built from it, e and f: too few.
    const hints = deduceHints(
      "classic",
      [{ pegs: [a, b, c, d], black: 1, white: 0 }],
      [],
    );

    expect(hints).toContainEqual({ kind: "hasRepeat" });
  });

  /* a and b are out; c and d are each in once, and neither is in slot 1. */
  const slotOneNarrowed: Guess[] = [
    { pegs: [a, a, a, a], black: 0, white: 0 },
    { pegs: [b, b, b, b], black: 0, white: 0 },
    { pegs: [c, a, a, a], black: 0, white: 1 },
    { pegs: [d, a, a, a], black: 0, white: 1 },
  ];

  it("shortlists a slot when few colours are left for it", () => {
    const hints = deduceHints("classic", slotOneNarrowed, []);

    expect(hints).toContainEqual({
      kind: "slotIsOneOf",
      slot: 1,
      colors: [e, f],
    });
    // The shortlist replaces the two "slot 1 can't be" lines it implies.
    expect(hints).not.toContainEqual({ kind: "slotIsNot", slot: 1, color: c });
  });

  it("says where to look for a colour that's in", () => {
    // c is also not in slot 2, which leaves slots 3 and 4.
    const hints = deduceHints(
      "classic",
      [...slotOneNarrowed, { pegs: [a, c, a, a], black: 0, white: 1 }],
      [],
    );

    expect(hints).toContainEqual({
      kind: "colorInSlots",
      color: c,
      slots: [3, 4],
    });
  });

  it("stays quiet when one clue settles nothing", () => {
    // Found by search: two bulls and no cows on four colours fixes no fact.
    expect(
      deduceHints("classic", [{ pegs: [a, b, c, d], black: 2, white: 0 }], []),
    ).toEqual([]);
  });

  it("says one code is left and fills every slot once the clues pin it", () => {
    const [p, q, r, s] = paletteFor("easy");
    const secret = [p, q, r, s];
    // Neither guess wins, yet together they leave only pqrs (found by search).
    const guesses = [
      scored(secret, [s, r, q, p]),
      scored(secret, [s, q, r, p]),
    ];
    const hints = deduceHints("easy", guesses, []);

    expect(hints).toContainEqual({ kind: "oneLeft" });
    expect(hints.some((hint) => hint.kind === "codesLeft")).toBe(false);
    for (const [index, color] of secret.entries()) {
      expect(hints).toContainEqual({ kind: "slotIs", slot: index + 1, color });
    }
  });
});

describe("deduceHints: the row being built", () => {
  const rowKinds = (current: (Color | null)[], guesses = fourCows) =>
    deduceHints("classic", guesses, current)
      .filter((hint) => hint.kind.startsWith("row"))
      .map((hint) => hint.kind);

  it("says nothing about an empty row", () => {
    expect(rowKinds([null, null, null, null])).toEqual([]);
  });

  it("warns about a ruled-out colour, once however often it's placed", () => {
    const guess: Guess = { pegs: [a, a, a, a], black: 0, white: 0 };
    const hints = deduceHints("classic", [guess], [a, a, c, null]);

    expect(hints.filter((hint) => hint.kind === "rowHasAbsent")).toEqual([
      { kind: "rowHasAbsent", color: a },
    ]);
  });

  it("flags a peg in a slot its colour can't have", () => {
    expect(
      deduceHints("classic", fourCows, [a, null, null, null]),
    ).toContainEqual({ kind: "rowSlotWrong", slot: 1, color: a });
  });

  it("confirms pegs that still fit, and a full row that could be the code", () => {
    expect(rowKinds([b, null, null, null])).toEqual(["rowFitsSoFar"]);
    expect(rowKinds([b, a, d, c])).toEqual(["rowFits"]);
  });

  it("catches pegs that each fit alone but not together", () => {
    // b can be in slot 1 or slot 3, but the code has only one b.
    expect(rowKinds([b, null, b, null])).toEqual(["rowNoFit"]);
  });

  it("names the clue a full row breaks", () => {
    // Clues from the secret bcda: row 1 is all cows, row 2 two bulls, two cows.
    const guesses = [
      scored([b, c, d, a], [a, b, c, d]),
      scored([b, c, d, a], [b, a, d, c]),
    ];
    // cdab reshuffles row 1 correctly, but keeps none of row 2's two bulls.
    const hints = deduceHints("classic", guesses, [c, d, a, b]);

    expect(hints).toContainEqual({ kind: "rowConflict", row: 2 });
    // Each peg could sit where it is; only the whole row is wrong.
    expect(hints.some((hint) => hint.kind === "rowSlotWrong")).toBe(false);
  });

  it("checks the row even when the board itself settles nothing", () => {
    const silent: Guess[] = [{ pegs: [a, b, c, d], black: 2, white: 0 }];

    expect(rowKinds([a, null, null, null], silent)).toEqual(["rowFitsSoFar"]);
  });
});

describe("deduceHints: never wrong", () => {
  it.each(DIFFICULTY_KEYS)(
    "every hint holds for the real secret on %s",
    (difficulty: Difficulty) => {
      const { pegs } = DIFFICULTIES[difficulty];
      const palette = paletteFor(difficulty);

      for (let seed = 1; seed <= 6; seed++) {
        const randomInt = seededRandomInt(seed);
        const secret = generateSecret(difficulty, randomInt);
        const randomRow = () =>
          Array.from(
            { length: pegs },
            () => palette[randomInt(palette.length)],
          );
        // More clues on later seeds, so late-game facts get checked too.
        const guesses = Array.from({ length: seed + 1 }, () =>
          scored(secret, randomRow()),
        );
        // Half-filled, so both row checks and partial fits come up.
        const current = randomRow().map((peg, index) =>
          index % 2 === 0 ? peg : null,
        );

        expect(consistentCodes(difficulty, guesses)).toContainEqual(secret);
        for (const hint of deduceHints(difficulty, guesses, current)) {
          // Wrapped so a failure prints the hint that lied.
          expect({ hint, isTrue: isTrueOf(hint, secret, current) }).toEqual({
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
    const keys = newsworthyHintKeys("classic", fourCows);

    // Four colours in, two out, no repeats: and nothing else.
    expect(keys).toContain(
      JSON.stringify({ kind: "present", colors: [a, b, c, d] }),
    );
    expect(keys).toContain(JSON.stringify({ kind: "noRepeats" }));
    expect(keys).toHaveLength(4);
    // The same clues give many more facts in the bubble itself.
    expect(deduceHints("classic", fourCows, []).length).toBeGreaterThan(4);
  });

  it("lights the dot for a proven count", () => {
    const keys = newsworthyHintKeys("classic", [
      { pegs: [a, a, a, a], black: 2, white: 0 },
    ]);

    expect(keys).toContain(
      JSON.stringify({ kind: "exactly", color: a, count: 2 }),
    );
  });
});
