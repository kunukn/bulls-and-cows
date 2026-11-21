import { describe, expect, it } from "vitest";
import { toPathUrl } from "./vercelInsights";

describe("toPathUrl", () => {
  it("moves the hash route into the path", () => {
    expect(
      toPathUrl("https://www.tyrko.app/#/highscores?difficulty=hard"),
    ).toBe("https://www.tyrko.app/highscores?difficulty=hard");
  });

  it("reports the game page as the site root", () => {
    expect(toPathUrl("https://www.tyrko.app/#/")).toBe(
      "https://www.tyrko.app/",
    );
  });

  it("keeps campaign params that sit before the hash", () => {
    expect(
      toPathUrl(
        "https://www.tyrko.app/?utm_source=qr#/highscores?difficulty=easy",
      ),
    ).toBe("https://www.tyrko.app/highscores?difficulty=easy&utm_source=qr");
  });

  it("keeps a base path in front of the route", () => {
    expect(toPathUrl("https://example.com/sub/#/highscores")).toBe(
      "https://example.com/sub/highscores",
    );
  });

  it("leaves URLs without a hash route untouched", () => {
    expect(toPathUrl("https://www.tyrko.app/?debug_rainbow=1")).toBe(
      "https://www.tyrko.app/?debug_rainbow=1",
    );
  });
});
