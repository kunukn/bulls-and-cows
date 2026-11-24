import {
  generateSecret,
  type Color,
  type Difficulty,
  type RandomInt,
} from "@/features/game/logic";
import type { GameEvent, GameInput } from "@/features/game/machine";

/* The daily code always plays by one difficulty's rules (0012). */
export const DAILY_DIFFICULTY: Difficulty = "classic";

/*
 * Where a shared result links, whichever site it was played on: the main
 * site, never a mirror or an embed's own address (0012).
 */
export const SHARE_DAILY_URL = "https://www.tyrko.app/daily";

const MS_PER_DAY = 86_400_000;

/*
 * Daily #1, as a local calendar date. Every player counts from the same
 * date, so the number names the same code everywhere. Moving it renumbers
 * every day and changes each day's code.
 */
const FIRST_DAY = { year: 2026, monthIndex: 10, day: 23 };

/*
 * The calendar date as UTC midnight, which makes the gap between two dates a
 * whole number of days. Local midnights don't: a daylight-saving day is 23 or
 * 25 hours long.
 */
function calendarDay(year: number, monthIndex: number, day: number): number {
  return Date.UTC(year, monthIndex, day) / MS_PER_DAY;
}

/* Which daily code a moment belongs to; it changes at local midnight. */
export function dailyNumber(now = new Date()): number {
  const today = calendarDay(now.getFullYear(), now.getMonth(), now.getDate());
  const firstDay = calendarDay(
    FIRST_DAY.year,
    FIRST_DAY.monthIndex,
    FIRST_DAY.day,
  );

  return today - firstDay + 1;
}

/* Local midnight that starts the given daily's day, for showing its date. */
export function dailyDate(number: number): Date {
  return new Date(
    FIRST_DAY.year,
    FIRST_DAY.monthIndex,
    FIRST_DAY.day + number - 1,
  );
}

export function msUntilNextDaily(now = new Date()): number {
  const nextMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  );

  return nextMidnight.getTime() - now.getTime();
}

/*
 * mulberry32: a small seeded generator, so the same seed gives the same
 * draws on every device. Not for secrets — anyone can replay it.
 */
export function seededRandomInt(seed: number): RandomInt {
  let state = seed >>> 0;

  return (max) => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), state | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    const fraction = ((mixed ^ (mixed >>> 14)) >>> 0) / 2 ** 32;

    return Math.floor(fraction * max);
  };
}

/* What the game machine needs to deal the given day's code. */
export function dailyGameInput(number: number): Required<GameInput> {
  return {
    difficulty: DAILY_DIFFICULTY,
    randomInt: seededRandomInt(number),
    dailyNumber: number,
  };
}

/* Asks a daily game to move on to the given day; the machine decides. */
export function nextDailyEvent(
  number: number,
): Extract<GameEvent, { type: "NEXT_DAILY" }> {
  return {
    type: "NEXT_DAILY",
    dailyNumber: number,
    randomInt: seededRandomInt(number),
  };
}

/*
 * The code for a day: the same for every player. It follows from the day
 * number, the generator above, and `generateSecret` with Classic's palette;
 * changing any of them changes codes players are comparing, so
 * daily.test.ts pins a few days.
 */
export function dailySecret(number: number): Color[] {
  return generateSecret(DAILY_DIFFICULTY, seededRandomInt(number));
}
