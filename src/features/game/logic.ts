export const COLORS = [
  "red",
  "blue",
  "green",
  "yellow",
  "purple",
  "orange",
  "pink",
  "cyan",
] as const;

export type Color = (typeof COLORS)[number];

export type Difficulty = "easy" | "classic" | "hard";

export type DifficultyConfig = {
  label: string;
  pegs: number;
  colors: number;
  maxGuesses: number;
  allowRepeats: boolean;
};

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: {
    label: "Easy",
    pegs: 4,
    colors: 6,
    maxGuesses: 10,
    allowRepeats: false,
  },
  classic: {
    label: "Classic",
    pegs: 4,
    colors: 6,
    maxGuesses: 10,
    allowRepeats: true,
  },
  hard: {
    label: "Hard",
    pegs: 5,
    colors: 8,
    maxGuesses: 12,
    allowRepeats: true,
  },
};

export const DIFFICULTY_KEYS = Object.keys(DIFFICULTIES) as Difficulty[];

export type Feedback = { black: number; white: number };

/* Returns an integer in [0, max). Injectable so tests can be deterministic. */
export type RandomInt = (max: number) => number;

export const cryptoRandomInt: RandomInt = (max) => {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);

  return buffer[0] % max;
};

export function paletteFor(difficulty: Difficulty): Color[] {
  return COLORS.slice(0, DIFFICULTIES[difficulty].colors);
}

export function generateSecret(
  difficulty: Difficulty,
  randomInt: RandomInt = cryptoRandomInt,
): Color[] {
  const { pegs, allowRepeats } = DIFFICULTIES[difficulty];
  const pool = paletteFor(difficulty);

  if (allowRepeats) {
    return Array.from({ length: pegs }, () => pool[randomInt(pool.length)]);
  }

  // Partial Fisher–Yates: draw `pegs` distinct colours.
  const remaining = [...pool];

  return Array.from({ length: pegs }, () => {
    const [picked] = remaining.splice(randomInt(remaining.length), 1);

    return picked;
  });
}

/*
 * Black = right colour, right position.
 * White = right colour, wrong position. Computed as the colour-multiset overlap
 * minus blacks, so duplicates are never double-counted.
 */
export function scoreGuess(
  secret: readonly Color[],
  guess: readonly Color[],
): Feedback {
  let black = 0;
  const secretCounts = new Map<Color, number>();
  const guessCounts = new Map<Color, number>();

  secret.forEach((color, index) => {
    if (guess[index] === color) black++;

    secretCounts.set(color, (secretCounts.get(color) ?? 0) + 1);
  });
  guess.forEach((color) => {
    guessCounts.set(color, (guessCounts.get(color) ?? 0) + 1);
  });

  let overlap = 0;
  for (const [color, count] of guessCounts) {
    overlap += Math.min(count, secretCounts.get(color) ?? 0);
  }

  return { black, white: overlap - black };
}
