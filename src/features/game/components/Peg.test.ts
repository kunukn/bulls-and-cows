import { COLORS } from "@/features/game/logic";
import { describe, expect, it } from "vitest";
import { PEG_INSERT_ANIMATIONS, pickInsertAnimation } from "./Peg";

const SLOTS = [0, 1, 2, 3];

describe("pickInsertAnimation", () => {
  it("returns one of the insert animations", () => {
    expect(PEG_INSERT_ANIMATIONS).toContain(pickInsertAnimation(3, 2, "red"));
  });

  it("varies when the same colour fills a row", () => {
    const variants = SLOTS.map((slot) => pickInsertAnimation(1, slot, "red"));

    expect(new Set(variants).size).toBeGreaterThan(1);
  });

  // Regression: a linear seed gave one variant for colours in palette order.
  it("varies when colours are placed in palette order", () => {
    const variants = SLOTS.map((slot) =>
      pickInsertAnimation(1, slot, COLORS[slot]),
    );

    expect(new Set(variants).size).toBeGreaterThan(1);
  });

  it("is stable for the same slot and colour", () => {
    expect(pickInsertAnimation(2, 1, "green")).toBe(
      pickInsertAnimation(2, 1, "green"),
    );
  });
});
