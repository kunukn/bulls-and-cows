import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COOLDOWN_MS, IDLE_MS, useShieldKnock } from "./useShieldKnock";

function stubReducedMotion(isReduced: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: isReduced && query.includes("reduce"),
  }));
}

function setup(isActive = true) {
  const animate = vi.fn<HTMLElement["animate"]>();
  const shieldRef = { current: { animate } as unknown as HTMLElement };
  const initial = {
    isActive,
    current: [null] as readonly unknown[],
    guesses: [] as readonly unknown[],
  };
  const hook = renderHook((options) => useShieldKnock(shieldRef, options), {
    initialProps: initial,
  });

  return { animate, hook, initial };
}

describe("useShieldKnock", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    stubReducedMotion(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("knocks once the player has been idle long enough", () => {
    const { animate } = setup();

    vi.advanceTimersByTime(IDLE_MS - 1);
    expect(animate).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(animate).toHaveBeenCalledTimes(1);
  });

  it("restarts the idle clock when a peg is placed", () => {
    const { animate, hook, initial } = setup();

    vi.advanceTimersByTime(IDLE_MS - 1000);
    hook.rerender({ ...initial, current: ["red"] });
    vi.advanceTimersByTime(IDLE_MS - 1000);

    expect(animate).not.toHaveBeenCalled();
  });

  it("waits out the cooldown between knocks, even across input", () => {
    const { animate, hook, initial } = setup();

    vi.advanceTimersByTime(IDLE_MS);
    expect(animate).toHaveBeenCalledTimes(1);

    hook.rerender({ ...initial, current: ["red"] });
    vi.advanceTimersByTime(COOLDOWN_MS - 1);
    expect(animate).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1);
    expect(animate).toHaveBeenCalledTimes(2);
  });

  it("stops for good once the bull is found", () => {
    const { animate, hook, initial } = setup();

    hook.rerender({ ...initial, isActive: false });
    vi.advanceTimersByTime(COOLDOWN_MS * 3);

    expect(animate).not.toHaveBeenCalled();
  });

  it("stays still under reduced motion", () => {
    stubReducedMotion(true);
    const { animate } = setup();

    vi.advanceTimersByTime(COOLDOWN_MS * 3);

    expect(animate).not.toHaveBeenCalled();
  });
});
