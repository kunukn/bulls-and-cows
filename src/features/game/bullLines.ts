import { DAILY_DIFFICULTY } from "@/features/daily/daily";
import { deduceHints, isRowHint, type Hint } from "./hints";
import {
  cryptoRandomInt,
  DIFFICULTIES,
  type Color,
  type Difficulty,
  type RandomInt,
} from "./logic";
import type { Guess } from "./machine";

export const QUIP_KEYS = [
  "bull.quips.hello",
  "bull.quips.names",
  "bull.quips.spots",
  "bull.quips.memory",
  "bull.quips.chewing",
  "bull.quips.history",
  "bull.quips.secret",
  "bull.quips.everyGuess",
  "bull.quips.moo",
  "bull.quips.difficulties",
  "bull.quips.cleanPegs",
  "bull.quips.takeTime",
  "bull.quips.koCounting",
  "bull.quips.favourite",
  "bull.quips.seeRed",
  "bull.quips.goodGuess",
  "bull.quips.hooves",
  "bull.quips.soundsEasy",
  "bull.quips.breathe",
  "bull.quips.danish",
] as const;

export const TIP_KEYS = [
  "bull.tips.differentColors",
  "bull.tips.noMatches",
  "bull.tips.keepColors",
  "bull.tips.oneChange",
  "bull.tips.fitClues",
  "bull.tips.doubles",
  "bull.tips.countPegs",
  "bull.tips.newColor",
] as const;

export const WON_KEYS = [
  "bull.won.cracked",
  "bull.won.impressed",
  "bull.won.again",
] as const;

export const LOST_KEYS = [
  "bull.lost.close",
  "bull.lost.nextOne",
  "bull.lost.lesson",
] as const;

/* The daily bull: calm, and nothing that steers the solve (0012). */
export const CALM_KEYS = [
  "bull.calm.breatheSlowly",
  "bull.calm.thinkFirst",
  "bull.calm.shoulders",
  "bull.calm.closeEyes",
  "bull.calm.feet",
  "bull.calm.stretch",
  "bull.calm.noRush",
] as const;

/* How the daily code works, in words that don't change from day to day. */
export const DAILY_KEYS = [
  "bull.daily.oneTry",
  "bull.daily.sameCode",
  "bull.daily.streak",
  "bull.daily.noHints",
] as const;

/* Facts about Classic, the daily code's rules (DAILY_DIFFICULTY). */
export const FACT_KEYS = [
  "bull.facts.knuth",
  "bull.facts.perfectAverage",
] as const;

type StaticKey =
  | (typeof QUIP_KEYS)[number]
  | (typeof TIP_KEYS)[number]
  | (typeof WON_KEYS)[number]
  | (typeof LOST_KEYS)[number]
  | (typeof CALM_KEYS)[number]
  | (typeof DAILY_KEYS)[number]
  | (typeof FACT_KEYS)[number];

/* Daily lines worked out at click time: they carry what they say. */
export type DailyFact =
  | { kind: "nextCode"; msUntilNext: number }
  | { kind: "seed"; dailyNumber: number }
  | { kind: "rules" }
  | { kind: "codeCount"; codes: number }
  | { kind: "wins"; won: number; played: number }
  | { kind: "averageWin"; guesses: number }
  | { kind: "bestStreak"; days: number };

export type BullLine =
  | { kind: "static"; key: StaticKey }
  | { kind: "hint"; hint: Hint }
  | { kind: "daily"; fact: DailyFact }
  | { kind: "noClues" };

type GameStatus = "playing" | "won" | "lost";

/* What the header bull needs to know: it chats, and never helps (0011). */
export type ChatSituation = {
  isPlayPage: boolean;
  status: GameStatus;
};

/* What the shield bull needs to know: it only helps with the game in play. */
export type HintSituation = {
  difficulty: Difficulty;
  guesses: readonly Guess[];
  current: readonly (Color | null)[];
};

/*
 * The player's own daily results, as `summarize` in
 * src/features/daily/store.ts reports them.
 */
export type DailyStats = {
  played: number;
  won: number;
  bestStreak: number;
  /* Wins per guess count: index 0 is a win on the first guess. */
  distribution: readonly number[];
};

/*
 * What the daily shield bull needs to know. Never the guesses: on the daily
 * code it talks about the day, not the clues (0012).
 */
export type DailySituation = {
  dailyNumber: number;
  msUntilNext: number;
  stats: DailyStats;
};

const toStatic = (keys: readonly StaticKey[]): BullLine[] =>
  keys.map((key) => ({ kind: "static", key }));

const toHintLines = (hints: readonly Hint[]): BullLine[] =>
  hints.map((hint) => ({ kind: "hint", hint }));

const toDailyLines = (facts: readonly DailyFact[]): BullLine[] =>
  facts.map((fact) => ({ kind: "daily", fact }));

/*
 * A daily fact is the same line whatever its numbers: the countdown differs
 * on every click, and would otherwise count as new each time.
 */
const isSameLine = (a: BullLine, b: BullLine) =>
  a.kind === "daily" && b.kind === "daily"
    ? a.fact.kind === b.fact.kind
    : JSON.stringify(a) === JSON.stringify(b);

/*
 * Picks a group, then a line in it, so each group gets an equal chance
 * however long it is. Never the previous line twice in a row when there's a
 * choice.
 */
function pickFrom(
  groups: BullLine[][],
  previous: BullLine | null,
  randomInt: RandomInt,
): BullLine {
  const fresh = groups
    .map((group) =>
      group.filter((line) => !previous || !isSameLine(line, previous)),
    )
    .filter((group) => group.length > 0);
  const pool = fresh.length > 0 ? fresh : groups;
  const group = pool[randomInt(pool.length)];

  return group[randomInt(group.length)];
}

/* The header bull: small talk, plus a word on the game just finished. */
export function pickChatLine(
  { isPlayPage, status }: ChatSituation,
  previous: BullLine | null,
  randomInt: RandomInt = cryptoRandomInt,
): BullLine {
  const groups = [toStatic(QUIP_KEYS)];
  if (isPlayPage && status === "won") groups.unshift(toStatic(WON_KEYS));
  if (isPlayPage && status === "lost") groups.unshift(toStatic(LOST_KEYS));

  return pickFrom(groups, previous, randomInt);
}

/*
 * The shield bull: general tips before the first guess, then deductions.
 * A fact about the row being built comes first and then alternates with
 * board facts: it's the one the player can act on right now, and would
 * otherwise be one voice among a dozen kinds.
 */
export function pickHintLine(
  { difficulty, guesses, current }: HintSituation,
  previous: BullLine | null,
  randomInt: RandomInt = cryptoRandomInt,
): BullLine {
  if (guesses.length === 0) {
    return pickFrom([toStatic(TIP_KEYS)], previous, randomInt);
  }

  const hints = deduceHints(difficulty, guesses, current);
  if (hints.length === 0) return { kind: "noClues" };

  const rowHints = hints.filter(isRowHint);
  const boardHints = hints.filter((hint) => !isRowHint(hint));
  const wasRowHint = previous?.kind === "hint" && isRowHint(previous.hint);
  if (rowHints.length > 0 && (!wasRowHint || boardHints.length === 0)) {
    return pickFrom([toHintLines(rowHints)], previous, randomInt);
  }

  /*
   * One group per kind of fact, so the many "slot can't be" facts don't crowd
   * out a single "at least two red". Not Map.groupBy: Safari has it from 17.4.
   */
  const byKind = new Map<Hint["kind"], Hint[]>();
  for (const hint of boardHints) {
    byKind.set(hint.kind, [...(byKind.get(hint.kind) ?? []), hint]);
  }

  return pickFrom([...byKind.values()].map(toHintLines), previous, randomInt);
}

/* The player's own numbers, once they have finished a daily code. */
function statFacts({
  played,
  won,
  bestStreak,
  distribution,
}: DailyStats): DailyFact[] {
  if (played === 0) return [];

  const facts: DailyFact[] = [{ kind: "wins", won, played }];
  if (won > 0) {
    const totalGuesses = distribution.reduce(
      (total, wins, index) => total + wins * (index + 1),
      0,
    );
    facts.push({ kind: "averageWin", guesses: totalGuesses / won });
  }
  if (bestStreak > 0) facts.push({ kind: "bestStreak", days: bestStreak });

  return facts;
}

/*
 * The shield bull on the daily code: calm words, how the day works, and
 * numbers. Never tips or deductions, so everyone solves the shared code on
 * their own (0012).
 */
export function pickDailyLine(
  { dailyNumber, msUntilNext, stats }: DailySituation,
  previous: BullLine | null,
  randomInt: RandomInt = cryptoRandomInt,
): BullLine {
  const { pegs, colors } = DIFFICULTIES[DAILY_DIFFICULTY];
  const groups = [
    toStatic(CALM_KEYS),
    [
      ...toStatic(DAILY_KEYS),
      ...toDailyLines([
        { kind: "nextCode", msUntilNext },
        { kind: "seed", dailyNumber },
        { kind: "rules" },
      ]),
    ],
    [
      ...toStatic(FACT_KEYS),
      ...toDailyLines([{ kind: "codeCount", codes: colors ** pegs }]),
    ],
  ];
  const yours = toDailyLines(statFacts(stats));
  if (yours.length > 0) groups.push(yours);

  return pickFrom(groups, previous, randomInt);
}
