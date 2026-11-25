/*
 * Tier order: a difficulty with N colours uses the first N. Six-colour modes
 * leave out blue, which colour-blind players confuse with purple (decision
 * 0004); Hard adds blue and pink.
 */
export const COLORS = [
  "red",
  "orange",
  "yellow",
  "green",
  "cyan",
  "purple",
  "blue",
  "pink",
] as const;

export type Color = (typeof COLORS)[number];

export type Difficulty = "easy" | "classic" | "hard";

export type DifficultyConfig = {
  pegs: number;
  colors: number;
  maxGuesses: number;
  allowRepeats: boolean;
};

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: {
    pegs: 4,
    colors: 6,
    maxGuesses: 10,
    allowRepeats: false,
  },
  classic: {
    pegs: 4,
    colors: 6,
    maxGuesses: 10,
    allowRepeats: true,
  },
  hard: {
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

/* Display order, by hue. */
const RAINBOW_ORDER: readonly Color[] = [
  "red",
  "orange",
  "yellow",
  "green",
  "cyan",
  "blue",
  "purple",
  "pink",
];

/* The difficulty's colours in rainbow order; digit shortcuts follow it. */
export function paletteFor(difficulty: Difficulty): Color[] {
  return COLORS.slice(0, DIFFICULTIES[difficulty].colors).toSorted(
    (a, b) => RAINBOW_ORDER.indexOf(a) - RAINBOW_ORDER.indexOf(b),
  );
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

  for (const [index, color] of secret.entries()) {
    if (guess[index] === color) black++;

    secretCounts.set(color, (secretCounts.get(color) ?? 0) + 1);
  }
  for (const color of guess) {
    guessCounts.set(color, (guessCounts.get(color) ?? 0) + 1);
  }

  let overlap = 0;
  for (const [color, count] of guessCounts) {
    overlap += Math.min(count, secretCounts.get(color) ?? 0);
  }

  return { black, white: overlap - black };
}

/* A checked row: the pegs played and the pins they earned. */
export type ScoredRow = Feedback & { pegs: readonly Color[] };

export function isScoredLike(code: readonly Color[], row: ScoredRow): boolean {
  const { black, white } = scoreGuess(code, row.pegs);

  return black === row.black && white === row.white;
}

/*
 * Every code the difficulty allows that scores exactly like each past guess,
 * so the secret is always among them. Worst case is Hard: 8⁵ = 32,768 codes.
 */
export function consistentCodes(
  difficulty: Difficulty,
  guesses: readonly ScoredRow[],
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

type Group = { feedback: Feedback; codes: Color[][] };

function isRankedHigher(a: readonly number[], b: readonly number[]): boolean {
  for (const [index, value] of a.entries()) {
    if (value !== b[index]) return value > b[index];
  }

  return false;
}

function isSameCode(a: readonly Color[], b: readonly Color[]): boolean {
  return a.every((color, index) => color === b[index]);
}

/*
 * Swap mode (0013): the code to score `guess` against, chosen after seeing it.
 * Every code that fits the earlier pins is split by the pins this guess would
 * earn, and the largest group is kept, so the pins never lie but tell as
 * little as possible. Ties avoid the winning group, then keep `currentSecret`
 * where they can, then show fewer pins. Deterministic, so a guard and an
 * action asking separately agree.
 */
export function dodgeSecret(
  difficulty: Difficulty,
  guesses: readonly ScoredRow[],
  guess: readonly Color[],
  currentSecret: readonly Color[],
): Color[] {
  const { pegs } = DIFFICULTIES[difficulty];
  const groups = new Map<string, Group>();

  for (const code of consistentCodes(difficulty, guesses)) {
    const feedback = scoreGuess(code, guess);
    const key = `${feedback.black}:${feedback.white}`;
    const group = groups.get(key);
    if (group) {
      group.codes.push(code);
    } else {
      groups.set(key, { feedback, codes: [code] });
    }
  }

  const holdsSecret = (codes: readonly Color[][]) =>
    codes.some((code) => isSameCode(code, currentSecret));
  // Higher wins, compared left to right.
  const rank = ({ feedback, codes }: Group) => [
    codes.length,
    feedback.black === pegs ? 0 : 1,
    holdsSecret(codes) ? 1 : 0,
    -(feedback.black + feedback.white),
    -feedback.black,
  ];

  let best: Group | undefined;
  for (const group of groups.values()) {
    if (!best || isRankedHigher(rank(group), rank(best))) best = group;
  }
  const codes = best?.codes ?? [];
  // No codes only if the saved pins contradict each other; keep the secret.
  if (codes.length === 0 || holdsSecret(codes)) return [...currentSecret];

  return codes[0];
}
