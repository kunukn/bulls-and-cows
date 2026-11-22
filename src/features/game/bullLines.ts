import { deduceHints, isRowHint, type Hint } from "./hints";
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

type StaticKey =
  | (typeof QUIP_KEYS)[number]
  | (typeof TIP_KEYS)[number]
  | (typeof WON_KEYS)[number]
  | (typeof LOST_KEYS)[number];

export type BullLine =
  | { kind: "static"; key: StaticKey }
  | { kind: "hint"; hint: Hint }
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

const toStatic = (keys: readonly StaticKey[]): BullLine[] =>
  keys.map((key) => ({ kind: "static", key }));

const toHintLines = (hints: readonly Hint[]): BullLine[] =>
  hints.map((hint) => ({ kind: "hint", hint }));

const isSameLine = (a: BullLine, b: BullLine) =>
  JSON.stringify(a) === JSON.stringify(b);

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
