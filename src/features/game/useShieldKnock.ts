import { useEffect, useRef, type RefObject } from "react";

/* No peg placed or guess checked for this long counts as idle. */
export const IDLE_MS = 20_000;

/* At most one knock per this long, however long the player stays idle. */
export const COOLDOWN_MS = 60_000;

const KNOCK_MS = 700;

/*
 * Knock-knock from under the shield: it lifts a little on its hinge and
 * drops back, twice, the second time lower (0001: a rigid lid on a hinge).
 * Each frame keeps the shield's own perspective, so the tilt foreshortens
 * the same way as its reveal.
 */
export const SHIELD_KNOCK_KEYFRAMES: Keyframe[] = [
  { transform: "perspective(2400px) rotateX(0)", easing: "ease-out" },
  {
    transform: "perspective(2400px) rotateX(9deg)",
    offset: 0.18,
    easing: "ease-in",
  },
  {
    transform: "perspective(2400px) rotateX(0)",
    offset: 0.36,
    easing: "ease-out",
  },
  {
    transform: "perspective(2400px) rotateX(5deg)",
    offset: 0.52,
    easing: "ease-in",
  },
  { transform: "perspective(2400px) rotateX(0)", offset: 0.7 },
  { transform: "perspective(2400px) rotateX(0)" },
];

type Options = {
  /* Shield bull shown and not yet found; false stops the knocking. */
  isActive: boolean;
  /* The row being built and the checked rows: a new reference is input. */
  current: readonly unknown[];
  guesses: readonly unknown[];
};

/*
 * Knocks the code shield on its hinge after the player has been idle, so
 * they notice the bull moulded into it can be asked (0011). The idle clock
 * restarts on every input and whenever the tab comes back into view.
 */
export function useShieldKnock(
  shieldRef: RefObject<HTMLElement | null>,
  { isActive, current, guesses }: Options,
) {
  // Survives input, so placing a peg doesn't shorten the cooldown.
  const lastKnockAt = useRef(-Infinity);

  useEffect(() => {
    if (!isActive) return;

    let timer: ReturnType<typeof setTimeout> | undefined;

    function schedule() {
      const delay = Math.max(
        IDLE_MS,
        lastKnockAt.current + COOLDOWN_MS - Date.now(),
      );
      timer = setTimeout(knock, delay);
    }

    function knock() {
      const isReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (!document.hidden && !isReducedMotion) {
        shieldRef.current?.animate(SHIELD_KNOCK_KEYFRAMES, {
          duration: KNOCK_MS,
        });
        lastKnockAt.current = Date.now();
      }
      schedule();
    }

    function handleVisibilityChange() {
      clearTimeout(timer);
      if (!document.hidden) schedule();
    }

    schedule();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [shieldRef, isActive, current, guesses]);
}
