import {
  FEEDBACK_POP_MS,
  FEEDBACK_STAGGER_MS,
} from "@/features/game/components/FeedbackPegs";
import { COLORS } from "@/features/game/logic";
import { describe, expect, it } from "vitest";
import { pickFeedbackTicks, pickPegRemovedSound, pickPegSound } from "./sound";

describe("pickPegSound", () => {
  it("stays within the pitch and volume ranges", () => {
    for (const color of COLORS) {
      for (let slot = 0; slot < 5; slot++) {
        const sound = pickPegSound(3, slot, color);
        expect(sound.clip).toMatch(/^peg-[1-5]\.wav$/);
        expect(sound.playbackRate).toBeGreaterThanOrEqual(0.92);
        expect(sound.playbackRate).toBeLessThanOrEqual(1.08);
        expect(sound.gain).toBeGreaterThanOrEqual(0.75);
        expect(sound.gain).toBeLessThanOrEqual(1);
      }
    }
  });

  it("varies across the slots of a row", () => {
    const clips = new Set(
      [0, 1, 2, 3].map((slot) => pickPegSound(1, slot, "red").clip),
    );
    expect(clips.size).toBeGreaterThan(1);
  });

  it("is stable for the same peg, without Math.random()", () => {
    expect(pickPegSound(2, 1, "green")).toEqual(pickPegSound(2, 1, "green"));
  });
});

describe("pickPegRemovedSound", () => {
  it("is the placed peg's clip, lower and quieter", () => {
    const placed = pickPegSound(2, 1, "green");
    const removed = pickPegRemovedSound(2, 1, "green");
    expect(removed.clip).toBe(placed.clip);
    expect(removed.playbackRate).toBeLessThan(placed.playbackRate);
    expect(removed.gain).toBeLessThan(placed.gain);
  });
});

describe("pickFeedbackTicks", () => {
  it("ticks once per key peg, bulls first and higher", () => {
    const ticks = pickFeedbackTicks(2, 1);
    expect(ticks).toHaveLength(3);
    expect(ticks[0].playbackRate).toBe(ticks[1].playbackRate);
    expect(ticks[1].playbackRate).toBeGreaterThan(ticks[2].playbackRate ?? 0);
  });

  it("ticks in order, while each key peg pops", () => {
    const delays = pickFeedbackTicks(1, 3).map((tick) => tick.delayMs ?? 0);

    for (const [index, delay] of delays.entries()) {
      // Key peg `index` pops from its animationDelay in FeedbackPegs.
      const popStart = index * FEEDBACK_STAGGER_MS;
      expect(delay).toBeGreaterThan(popStart);
      expect(delay).toBeLessThan(popStart + FEEDBACK_POP_MS);
    }
    for (let index = 1; index < delays.length; index++) {
      expect(delays[index]).toBeGreaterThan(delays[index - 1]);
    }
  });

  it("is silent for no matches", () => {
    expect(pickFeedbackTicks(0, 0)).toEqual([]);
  });
});
