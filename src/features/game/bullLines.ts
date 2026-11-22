import { deduceHints, type Hint } from "./hints";
import {
  cryptoRandomInt,
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

type StaticKey =
  | (typeof QUIP_KEYS)[number]
  | (typeof TIP_KEYS)[number]
  | (typeof WON_KEYS)[number]
  | (typeof LOST_KEYS)[number];

export type BullLine =
  | { kind: "static"; key: StaticKey }
  | { kind: "hint"; hint: Hint }
  | { kind: "noClues" };

export type BullSituation = {
  isPlayPage: boolean;
  status: "playing" | "won" | "lost";
  difficulty: Difficulty;
  guesses: readonly Guess[];
  current: readonly (Color | null)[];
  /* Settings switch (0011); off, Tyr gives general tips instead of deductions. */
  isHintsEnabled: boolean;
};

const toStatic = (keys: readonly StaticKey[]): BullLine[] =>
  keys.map((key) => ({ kind: "static", key }));

/*
 * Lines grouped so each group gets an equal chance: one kind of hint (a
 * colour that's out, a slot that's settled…) can't crowd out the rest just
 * because the clues produce many of them.
 */
function groupsFor(situation: BullSituation): BullLine[][] {
  const { isPlayPage, status, difficulty, guesses, current, isHintsEnabled } =
    situation;

  if (!isPlayPage) return [toStatic(QUIP_KEYS)];

  if (status === "won") return [toStatic(WON_KEYS), toStatic(QUIP_KEYS)];

  if (status === "lost") return [toStatic(LOST_KEYS), toStatic(QUIP_KEYS)];

  if (guesses.length === 0 || !isHintsEnabled) {
    return [toStatic(TIP_KEYS), toStatic(QUIP_KEYS)];
  }

  const hints = deduceHints(difficulty, guesses, current);
  if (hints.length === 0) return [[{ kind: "noClues" }]];

  // Not Map.groupBy: Safari only has it from 17.4.
  const byKind = new Map<Hint["kind"], BullLine[]>();
  for (const hint of hints) {
    const group = byKind.get(hint.kind) ?? [];
    group.push({ kind: "hint", hint });
    byKind.set(hint.kind, group);
  }

  return [...byKind.values()];
}

const isSameLine = (a: BullLine, b: BullLine) =>
  JSON.stringify(a) === JSON.stringify(b);

/* What Tyr says on this click; never the previous line twice in a row when there's a choice. */
export function pickBullLine(
  situation: BullSituation,
  previous: BullLine | null,
  randomInt: RandomInt = cryptoRandomInt,
): BullLine {
  const groups = groupsFor(situation);
  const fresh = groups
    .map((group) =>
      group.filter((line) => !previous || !isSameLine(line, previous)),
    )
    .filter((group) => group.length > 0);
  const pool = fresh.length > 0 ? fresh : groups;
  const group = pool[randomInt(pool.length)];

  return group[randomInt(group.length)];
}
