import { COLORS } from "@/features/game/logic";
import { describe, expect, it } from "vitest";
import { pickPegSound } from "./sound";

describe("pickPegSound", () => {
  it("stays within the clip, pitch and volume ranges", () => {
    for (const color of COLORS) {
      for (let slot = 0; slot < 5; slot++) {
        const sound = pickPegSound(3, slot, color);
        expect(sound.clipIndex).toBeGreaterThanOrEqual(0);
        expect(sound.clipIndex).toBeLessThan(5);
        expect(sound.playbackRate).toBeGreaterThanOrEqual(0.92);
        expect(sound.playbackRate).toBeLessThanOrEqual(1.08);
        expect(sound.gain).toBeGreaterThanOrEqual(0.75);
        expect(sound.gain).toBeLessThanOrEqual(1);
      }
    }
  });

  it("varies across the slots of a row", () => {
    const clips = new Set(
      [0, 1, 2, 3].map((slot) => pickPegSound(1, slot, "red").clipIndex),
    );
    expect(clips.size).toBeGreaterThan(1);
  });

  it("is stable for the same peg", () => {
    expect(pickPegSound(2, 1, "green")).toEqual(pickPegSound(2, 1, "green"));
  });
});
