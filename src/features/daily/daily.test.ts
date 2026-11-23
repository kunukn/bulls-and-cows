import { createActor } from "xstate";
import { gameMachine } from "@/features/game/machine";
import {
  DAILY_DIFFICULTY,
  dailyDate,
  dailyGameInput,
  dailyNumber,
  dailySecret,
  msUntilNextDaily,
} from "./daily";

describe("dailyNumber", () => {
  // The launch date is the spec here: it fixes which code each number names.
  it("starts at #1 on 23 November 2026", () => {
    expect(dailyNumber(new Date(2026, 10, 23, 12))).toBe(1);
  });

  it("changes at local midnight and stays the same all day", () => {
    const morning = dailyNumber(new Date(2026, 11, 9, 0, 0, 0));
    const lastSecond = dailyNumber(new Date(2026, 11, 9, 23, 59, 59));
    const nextDay = dailyNumber(new Date(2026, 11, 10, 0, 0, 0));

    expect(lastSecond).toBe(morning);
    expect(nextDay).toBe(morning + 1);
  });

  describe("where clocks change for daylight saving", () => {
    beforeAll(() => {
      vi.stubEnv("TZ", "Europe/Copenhagen");
    });
    afterAll(() => {
      vi.unstubAllEnvs();
    });

    /*
     * 28 March 2027 is 23 hours long and 31 October 2027 is 25. Counting
     * elapsed 24-hour blocks would put the half hours on the wrong day.
     */
    it.each([
      ["spring forward", new Date(2027, 2, 27), new Date(2027, 2, 30)],
      ["fall back", new Date(2027, 9, 30), new Date(2027, 10, 2)],
    ])("gives each calendar day one number across %s", (_label, from, to) => {
      const first = dailyNumber(from);
      const days = dailyNumber(to) - first;
      const year = from.getFullYear();
      const month = from.getMonth();

      expect(days).toBe(3);
      for (let offset = 0; offset <= days; offset++) {
        const day = from.getDate() + offset;

        expect(dailyNumber(new Date(year, month, day, 0, 30))).toBe(
          first + offset,
        );
        expect(dailyNumber(new Date(year, month, day, 23, 30))).toBe(
          first + offset,
        );
      }
    });

    it("shows a number the date it is played on", () => {
      for (const date of [new Date(2027, 2, 29, 9), new Date(2027, 10, 1, 9)]) {
        const shown = dailyDate(dailyNumber(date));

        expect(shown.toDateString()).toBe(date.toDateString());
      }
    });
  });
});

describe("msUntilNextDaily", () => {
  it("counts down to local midnight", () => {
    expect(msUntilNextDaily(new Date(2026, 11, 9, 23, 59, 59))).toBe(1000);
    expect(msUntilNextDaily(new Date(2026, 11, 9, 18, 0, 0))).toBe(
      6 * 60 * 60 * 1000,
    );
  });
});

describe("dailySecret", () => {
  /*
   * Pinned on purpose: these are the codes players compare. A change to the
   * generator, the seed, or Classic's palette turns this red — it must be a
   * decision, not a side effect.
   */
  it.each([
    [1, ["green", "red", "green", "purple"]],
    [2, ["cyan", "orange", "orange", "green"]],
    [365, ["cyan", "green", "orange", "green"]],
    [1000, ["cyan", "cyan", "cyan", "purple"]],
  ])("deals the same code to everyone on day %i", (number, secret) => {
    expect(dailySecret(number)).toEqual(secret);
  });

  it("is the code the daily game is played against", () => {
    const actor = createActor(gameMachine, {
      input: dailyGameInput(365),
    }).start();
    const {
      secret,
      difficulty,
      dailyNumber: number,
    } = actor.getSnapshot().context;

    expect(secret).toEqual(dailySecret(365));
    expect(difficulty).toBe(DAILY_DIFFICULTY);
    expect(number).toBe(365);
  });
});
