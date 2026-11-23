import { shareText } from "@/features/daily/share";
import { DIFFICULTIES } from "@/features/game/logic";
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
    pegs: PEGS,
    url: "https://www.tyrko.app/daily",
  });

  expect(text).toBe(
    [
      "Tyr & Ko · Daily code #3 · 3/10",
      "",
      "◽◽◽◽",
      "⚫⚪⚪◽",
      "⚫⚫⚫⚫",
      "",
      "https://www.tyrko.app/daily",
    ].join("\n"),
  );
});
