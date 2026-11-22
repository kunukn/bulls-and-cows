import {
  DIFFICULTIES,
  paletteFor,
  scoreGuess,
  type Color,
  type Difficulty,
} from "./logic";
import type { Guess } from "./machine";

/* A fact that follows from the player's own clues; slots are 1-based. */
export type Hint =
  | { kind: "absent"; color: Color }
  | { kind: "present"; colors: Color[] }
  | { kind: "slotIs"; slot: number; color: Color }
  | { kind: "slotIsNot"; slot: number; color: Color }
  | { kind: "noRepeats" }
  | { kind: "rowHasAbsent"; color: Color }
  | { kind: "codesLeft"; count: number }
  | { kind: "oneLeft" };

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

    const isConsistent = guesses.every((guess) => {
      const { black, white } = scoreGuess(code, guess.pegs);

      return black === guess.black && white === guess.white;
    });
    if (isConsistent) codes.push(code);
  }

  return codes;
}

/*
 * Facts true of every code still possible. Empty when the clues don't settle
 * anything yet; a remaining-codes count only joins a real fact, since on its
 * own it isn't a tip. Never names the whole code (decision 0011).
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
  const hints: Hint[] = [];

  const absent = palette.filter((color) =>
    codes.every((code) => !code.includes(color)),
  );
  for (const color of absent) hints.push({ kind: "absent", color });

  const present = palette.filter((color) =>
    codes.every((code) => code.includes(color)),
  );
  if (present.length > 0) hints.push({ kind: "present", colors: present });

  for (let index = 0; index < pegs; index++) {
    const colorsHere = new Set(codes.map((code) => code[index]));
    const slot = index + 1;
    const [onlyColor] = colorsHere;

    if (colorsHere.size === 1) {
      hints.push({ kind: "slotIs", slot, color: onlyColor });
      continue;
    }
    // An absent colour fits no slot; saying so per slot would be noise.
    for (const color of palette) {
      if (!absent.includes(color) && !colorsHere.has(color)) {
        hints.push({ kind: "slotIsNot", slot, color });
      }
    }
  }

  if (allowRepeats && codes.every((code) => new Set(code).size === pegs)) {
    hints.push({ kind: "noRepeats" });
  }

  const rowColors = new Set(current.filter((color) => color !== null));
  for (const color of rowColors) {
    if (absent.includes(color)) hints.push({ kind: "rowHasAbsent", color });
  }

  if (hints.length === 0) return [];

  hints.push(
    codes.length === 1
      ? { kind: "oneLeft" }
      : { kind: "codesLeft", count: codes.length },
  );

  return hints;
}
