import {
  composeUrl,
  countCodesLeft,
  SHARE_NETWORKS,
  shareText,
} from "@/features/daily/share";
import {
  DIFFICULTIES,
  paletteFor,
  scoreGuess,
  type Color,
} from "@/features/game/logic";
import { expect, test } from "vitest";
import { DAILY_DIFFICULTY } from "./daily";

const PEGS = DIFFICULTIES[DAILY_DIFFICULTY].pegs;

test("one line per guess, bulls then cows then misses", () => {
  const text = shareText({
    heading: "Tyr & Ko · Daily code #3 · 3/10",
    guesses: [
      { black: 0, white: 0 },
      { black: 1, white: 2 },
      { black: PEGS, white: 0 },
    ],
    codesLeft: [256, 2, 1],
    pegs: PEGS,
    streak: 0,
    streakLabel: "Streak",
    luckyLabel: "Lucky",
    url: "https://www.tyrko.app/daily",
  });

  expect(text).toBe(
    [
      "Tyr & Ko · Daily code #3 · 3/10",
      "",
      "◽◽◽◽ 256",
      "⚫⚪⚪◽ 2",
      "⚫⚫⚫⚫",
      "",
      "https://www.tyrko.app/daily",
    ].join("\n"),
  );
});

const RESULT = {
  heading: "Tyr & Ko · Daily code #3 · 2/10",
  guesses: [
    { black: 1, white: 2 },
    { black: PEGS, white: 0 },
  ],
  codesLeft: [2, 1],
  pegs: PEGS,
  streak: 0,
  streakLabel: "Streak",
  luckyLabel: "Lucky",
  url: "https://www.tyrko.app/daily",
};

test("the Threads text uses text circles, as its post link breaks emoji", () => {
  expect(shareText({ ...RESULT, network: "threads" })).toBe(
    [
      "Tyr & Ko · Daily code #3 · 2/10",
      "",
      "●◎◎○ 2",
      "●●●●",
      "",
      "https://www.tyrko.app/daily",
    ].join("\n"),
  );
});

test.each(["x", "bluesky"] as const)(
  "the %s text keeps the emoji of the share sheet",
  (network) => {
    expect(shareText({ ...RESULT, network })).toBe(shareText(RESULT));
  },
);

test.each(SHARE_NETWORKS)(
  "the %s post link carries the whole result, intact",
  (network) => {
    // "&" would end the parameter, "+" would read as a space if left raw.
    const text = "Tyr & Ko · 1+1\n\n⚫⚪◽◽\n\nhttps://www.tyrko.app/daily";
    const url = new URL(composeUrl(network, text));

    expect([...url.searchParams.keys()]).toEqual(["text"]);
    // Decoded the strict way, so a "+" written for a space shows up here.
    expect(decodeURIComponent(url.search.slice("?text=".length))).toBe(text);
  },
);

test("a loss keeps the count on its last row: the code was among those", () => {
  const text = shareText({
    heading: "Tyr & Ko · Daily code #3 · X/10",
    guesses: [
      { black: 2, white: 1 },
      { black: PEGS - 1, white: 0 },
    ],
    codesLeft: [20, 3],
    pegs: PEGS,
    streak: 0,
    streakLabel: "Streak",
    luckyLabel: "Lucky",
    url: "https://www.tyrko.app/daily",
  });

  expect(text.split("\n").slice(2, 4)).toEqual(["⚫⚫⚪◽ 20", "⚫⚫⚫◽ 3"]);
});

test("a streak follows the score, as a flame where emoji work", () => {
  const heading = shareText({ ...RESULT, streak: 5 }).split("\n")[0];

  expect(heading).toBe("Tyr & Ko · Daily code #3 · 2/10 · 🔥5");
});

test("the Threads text writes the streak in words, as its link breaks emoji", () => {
  const heading = shareText({
    ...RESULT,
    streak: 5,
    streakLabel: "I træk",
    network: "threads",
  }).split("\n")[0];

  expect(heading).toBe("Tyr & Ko · Daily code #3 · 2/10 · I træk 5");
});

test("no streak, no mention: a loss or a first game keeps the plain heading", () => {
  expect(shareText(RESULT).split("\n")[0]).toBe(RESULT.heading);
});

/* A win on the second guess, after `before` codes were left. */
function secondGuessWin(before: number, network?: "threads") {
  const text = shareText({
    ...RESULT,
    codesLeft: [before, 1],
    network,
  });

  return text.split("\n")[3];
}

test("a win from 4 or fewer codes left gets no mark: luck stays rare", () => {
  expect(secondGuessWin(1)).toBe("⚫⚫⚫⚫");
  expect(secondGuessWin(4)).toBe("⚫⚫⚫⚫");
});

test("a win from 5 to 24 codes left gets a clover: 1 in 5 or worse", () => {
  expect(secondGuessWin(5)).toBe("⚫⚫⚫⚫ 🍀");
  expect(secondGuessWin(24)).toBe("⚫⚫⚫⚫ 🍀");
});

test("a win from 25 or more codes left gets a unicorn: 1 in 25 or worse", () => {
  expect(secondGuessWin(25)).toBe("⚫⚫⚫⚫ 🦄");
  expect(secondGuessWin(312)).toBe("⚫⚫⚫⚫ 🦄");
});

test("a first-guess win gets a unicorn: every code still fit", () => {
  const text = shareText({
    ...RESULT,
    guesses: [{ black: PEGS, white: 0 }],
    codesLeft: [1],
  });

  expect(text.split("\n")[2]).toBe("⚫⚫⚫⚫ 🦄");
});

test("the Threads text writes either luck in words, as its link breaks emoji", () => {
  expect(secondGuessWin(5, "threads")).toBe("●●●● Lucky");
  expect(secondGuessWin(312, "threads")).toBe("●●●● Lucky");
});

const PALETTE = paletteFor(DAILY_DIFFICULTY);

function scoredAgainst(secret: readonly Color[], guesses: Color[][]) {
  return guesses.map((pegs) => ({ pegs, ...scoreGuess(secret, pegs) }));
}

test("codes left after a miss: every code without the colours guessed", () => {
  const [first, second, ...others] = PALETTE;
  const secret = Array.from({ length: PEGS }, () => others[0]);
  const rows = scoredAgainst(secret, [
    Array.from({ length: PEGS }, () => first),
    Array.from({ length: PEGS }, () => second),
  ]);

  // Each slot can still hold any colour not ruled out.
  expect(countCodesLeft(DAILY_DIFFICULTY, rows)).toEqual([
    (PALETTE.length - 1) ** PEGS,
    (PALETTE.length - 2) ** PEGS,
  ]);
});

test("codes left only shrink, down to the secret alone on a win", () => {
  const secret = PALETTE.slice(0, PEGS);
  const rows = scoredAgainst(secret, [
    PALETTE.slice(1, PEGS + 1),
    [...secret].reverse(),
    secret,
  ]);
  const counts = countCodesLeft(DAILY_DIFFICULTY, rows);

  expect(counts).toEqual(counts.toSorted((a, b) => b - a));
  expect(counts.at(-1)).toBe(1);
});
