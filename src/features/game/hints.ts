import {
  DIFFICULTIES,
  paletteFor,
  scoreGuess,
  type Color,
  type Difficulty,
} from "./logic";
import type { Guess } from "./machine";

/* About the row being built: the most actionable help, so it's offered first. */
export type RowHint =
  | { kind: "rowHasAbsent"; color: Color }
  /* A colour placed twice where codes never repeat one (Easy). */
  | { kind: "rowRepeat"; color: Color }
  | { kind: "rowSlotWrong"; slot: number; color: Color }
  /* A full row that can't be the code; `row` is the first clue it breaks. */
  | { kind: "rowConflict"; row: number }
  /* Each peg is possible alone, but no code left has them all. */
  | { kind: "rowNoFit" }
  | { kind: "rowFits" }
  | { kind: "rowFitsSoFar" };

/* A fact that follows from the player's own clues; slots and rows are 1-based. */
export type Hint =
  | { kind: "absent"; color: Color }
  | { kind: "present"; colors: Color[] }
  | { kind: "exactly"; color: Color; count: number }
  | { kind: "atLeast"; color: Color; count: number }
  | { kind: "atMostOne"; color: Color }
  | { kind: "slotIs"; slot: number; color: Color }
  | { kind: "slotIsOneOf"; slot: number; colors: Color[] }
  | { kind: "slotIsNot"; slot: number; color: Color }
  | { kind: "colorInSlots"; color: Color; slots: number[] }
  | { kind: "noRepeats" }
  | { kind: "hasRepeat" }
  | { kind: "codesLeft"; count: number }
  | { kind: "oneLeft" }
  | RowHint;

const ROW_HINT_KINDS: ReadonlySet<Hint["kind"]> = new Set<RowHint["kind"]>([
  "rowHasAbsent",
  "rowRepeat",
  "rowSlotWrong",
  "rowConflict",
  "rowNoFit",
  "rowFits",
  "rowFitsSoFar",
]);

export function isRowHint(hint: Hint): hint is RowHint {
  return ROW_HINT_KINDS.has(hint.kind);
}

function isScoredLike(code: readonly Color[], guess: Guess): boolean {
  const { black, white } = scoreGuess(code, guess.pegs);

  return black === guess.black && white === guess.white;
}

/*
 * Every code the difficulty allows that scores exactly like each past guess,
 * so the secret is always among them. Worst case is Hard: 8⁵ = 32,768 codes.
 */
export function consistentCodes(
  difficulty: Difficulty,
  guesses: readonly Guess[],
): Color[][] {
  const palette = paletteFor(difficulty);
  const { pegs, allowRepeats } = DIFFICULTIES[difficulty];
  const total = palette.length ** pegs;
  const codes: Color[][] = [];

  for (let number = 0; number < total; number++) {
    // Read `number` in base `palette.length`, one digit per slot.
    const code: Color[] = [];
    let rest = number;
    for (let slot = 0; slot < pegs; slot++) {
      code.push(palette[rest % palette.length]);
      rest = Math.floor(rest / palette.length);
    }
    if (!allowRepeats && new Set(code).size < pegs) continue;

    if (guesses.every((guess) => isScoredLike(code, guess))) codes.push(code);
  }

  return codes;
}

/*
 * Facts true of every code still possible, plus what they say about the row
 * being built. Empty when nothing is settled yet; the remaining-codes count
 * only joins another fact, since on its own it isn't a tip. Never names the
 * whole code (decision 0011).
 */
export function deduceHints(
  difficulty: Difficulty,
  guesses: readonly Guess[],
  current: readonly (Color | null)[],
): Hint[] {
  if (guesses.length === 0) return [];

  const codes = consistentCodes(difficulty, guesses);
  // Only a corrupt save could leave no code; say nothing rather than nonsense.
  if (codes.length === 0) return [];

  const palette = paletteFor(difficulty);
  const { pegs, allowRepeats } = DIFFICULTIES[difficulty];

  /*
   * One pass over the codes left. Per colour: the fewest and most pegs of it
   * in any code. Per slot: the colours some code has there.
   */
  const fewest = new Map(palette.map((color) => [color, pegs]));
  const most = new Map(palette.map((color) => [color, 0]));
  const slotColors = Array.from({ length: pegs }, () => new Set<Color>());
  let isAlwaysDistinct = true;
  let isAlwaysRepeating = true;
  for (const code of codes) {
    const counts = new Map<Color, number>();
    for (const [index, color] of code.entries()) {
      counts.set(color, (counts.get(color) ?? 0) + 1);
      slotColors[index].add(color);
    }
    for (const color of palette) {
      const count = counts.get(color) ?? 0;
      fewest.set(color, Math.min(fewest.get(color) ?? count, count));
      most.set(color, Math.max(most.get(color) ?? count, count));
    }
    if (counts.size === pegs) isAlwaysRepeating = false;
    else isAlwaysDistinct = false;
  }
  const fewestOf = (color: Color) => fewest.get(color) ?? 0;
  const mostOf = (color: Color) => most.get(color) ?? 0;

  const hints: Hint[] = [];
  const absent = palette.filter((color) => mostOf(color) === 0);
  const live = palette.filter((color) => mostOf(color) > 0);
  const present = palette.filter((color) => fewestOf(color) >= 1);

  for (const color of absent) hints.push({ kind: "absent", color });
  if (present.length > 0) hints.push({ kind: "present", colors: present });

  /*
   * How many pegs of a colour. Skipped where colours can't repeat (Easy, or a
   * code proven repeat-free): there "in the code" already means exactly one.
   */
  if (!isAlwaysDistinct) {
    for (const color of live) {
      const low = fewestOf(color);
      const high = mostOf(color);
      if (low === high) hints.push({ kind: "exactly", color, count: low });
      else if (low >= 2) hints.push({ kind: "atLeast", color, count: low });
      else if (high === 1) hints.push({ kind: "atMostOne", color });
    }
  }

  for (const [index, colorsHere] of slotColors.entries()) {
    const slot = index + 1;
    const possible = live.filter((color) => colorsHere.has(color));
    // An absent colour fits no slot; saying so per slot would be noise.
    const excluded = live.filter((color) => !colorsHere.has(color));

    if (possible.length === 1) {
      hints.push({ kind: "slotIs", slot, color: possible[0] });
    } else if (possible.length <= 3 && possible.length <= excluded.length) {
      // Whichever is shorter to say: the few it can be, or the few it can't.
      hints.push({ kind: "slotIsOneOf", slot, colors: possible });
    } else {
      for (const color of excluded) {
        hints.push({ kind: "slotIsNot", slot, color });
      }
    }
  }

  // Where to look for a colour known to be in: only when it narrows the search.
  for (const color of present) {
    const indexes = slotColors.flatMap((colorsHere, index) =>
      colorsHere.has(color) ? [index] : [],
    );
    // A settled slot is already a "slot is" fact.
    const isAnySettled = indexes.some((index) => slotColors[index].size === 1);
    if (!isAnySettled && indexes.length >= 2 && indexes.length <= pegs - 2) {
      hints.push({
        kind: "colorInSlots",
        color,
        slots: indexes.map((index) => index + 1),
      });
    }
  }

  /*
   * Always true on Easy, where it's the rule rather than a deduction: said
   * only to a player doubling a colour, in this row or the last guess.
   */
  const lastGuess = guesses[guesses.length - 1].pegs;
  const isDoubling = hasRepeat(lastGuess) || hasRepeat(current);
  if (allowRepeats ? isAlwaysDistinct : isDoubling) {
    hints.push({ kind: "noRepeats" });
  }
  if (isAlwaysRepeating) hints.push({ kind: "hasRepeat" });

  hints.push(
    ...deduceRowHints(
      current,
      guesses,
      codes,
      absent,
      slotColors,
      allowRepeats,
    ),
  );

  if (hints.length === 0) return [];

  hints.push(
    codes.length === 1
      ? { kind: "oneLeft" }
      : { kind: "codesLeft", count: codes.length },
  );

  return hints;
}

/* True when a colour appears more than once; empty slots don't count. */
function hasRepeat(row: readonly (Color | null)[]): boolean {
  const colors = row.filter((color) => color !== null);

  return new Set(colors).size < colors.length;
}

/* Checks the pegs already in the active row against the codes left. */
function deduceRowHints(
  current: readonly (Color | null)[],
  guesses: readonly Guess[],
  codes: readonly Color[][],
  absent: readonly Color[],
  slotColors: readonly Set<Color>[],
  allowRepeats: boolean,
): RowHint[] {
  const filled = current.flatMap((color, index) =>
    color === null ? [] : [{ index, color }],
  );
  if (filled.length === 0) return [];

  const hints: RowHint[] = [];
  const filledColors = filled.map((peg) => peg.color);
  for (const color of new Set(filledColors)) {
    if (absent.includes(color)) hints.push({ kind: "rowHasAbsent", color });
    const isRepeated =
      filledColors.indexOf(color) !== filledColors.lastIndexOf(color);
    if (!allowRepeats && isRepeated) hints.push({ kind: "rowRepeat", color });
  }
  for (const { index, color } of filled) {
    if (!absent.includes(color) && !slotColors[index].has(color)) {
      hints.push({ kind: "rowSlotWrong", slot: index + 1, color });
    }
  }

  const isFitting = codes.some((code) =>
    filled.every(({ index, color }) => code[index] === color),
  );
  const isComplete = filled.length === current.length;

  if (isFitting) {
    hints.push({ kind: isComplete ? "rowFits" : "rowFitsSoFar" });
  } else if (isComplete) {
    const row = filled.map((peg) => peg.color);
    const brokenClue = guesses.findIndex((guess) => !isScoredLike(row, guess));
    // A repeat on Easy can fit every clue and still not be a code.
    if (brokenClue >= 0) {
      hints.push({ kind: "rowConflict", row: brokenClue + 1 });
    }
  } else if (hints.length === 0) {
    hints.push({ kind: "rowNoFit" });
  }

  return hints;
}

const NEWSWORTHY_KINDS: ReadonlySet<Hint["kind"]> = new Set<Hint["kind"]>([
  "absent",
  "present",
  "exactly",
  "atLeast",
  "slotIs",
  "slotIsOneOf",
  "noRepeats",
  "hasRepeat",
  "oneLeft",
]);

/*
 * Facts worth showing the "new hint" dot for, as stable keys. Leaves out the
 * code count (it changes every guess), single slot exclusions and "at most"
 * facts (nearly every guess adds some) and row checks (they follow the pegs,
 * not the clues).
 */
export function newsworthyHintKeys(
  difficulty: Difficulty,
  guesses: readonly Guess[],
): string[] {
  // Without repeats, "no repeats" is the rule, not news from a guess.
  const isRule = (hint: Hint) =>
    hint.kind === "noRepeats" && !DIFFICULTIES[difficulty].allowRepeats;

  return deduceHints(difficulty, guesses, [])
    .filter((hint) => NEWSWORTHY_KINDS.has(hint.kind) && !isRule(hint))
    .map((hint) => JSON.stringify(hint));
}
