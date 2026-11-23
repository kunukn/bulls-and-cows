import { composeUrl, SHARE_NETWORKS, shareText } from "@/features/daily/share";
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

const RESULT = {
  heading: "Tyr & Ko · Daily code #3 · 2/10",
  guesses: [
    { black: 1, white: 2 },
    { black: PEGS, white: 0 },
  ],
  pegs: PEGS,
  url: "https://www.tyrko.app/daily",
};

test("the Threads text uses text circles, as its post link breaks emoji", () => {
  expect(shareText({ ...RESULT, network: "threads" })).toBe(
    [
      "Tyr & Ko · Daily code #3 · 2/10",
      "",
      "●◎◎○",
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
