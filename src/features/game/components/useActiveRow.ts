import { useGameActorRef } from "@/features/game/machine-context";
import { useEffect, useRef } from "react";

/* Symmetric, so it needs no RTL counterpart. */
const ROW_SHAKE_KEYFRAMES: Keyframe[] = [
  { transform: "translateX(0)" },
  { transform: "translateX(-5px)" },
  { transform: "translateX(5px)" },
  { transform: "translateX(-3px)" },
  { transform: "translateX(2px)" },
  { transform: "translateX(0)" },
];

/**
 * Ref for the row being filled in. Scrolls it into view as guesses are
 * scored and shakes it when the machine rejects an unfinished row.
 */
export function useActiveRow(guessCount: number) {
  const actor = useGameActorRef();
  const activeRowRef = useRef<HTMLLIElement>(null);

  /*
   * Keep the active row visible on small screens as the board grows, clear
   * of the sticky dock by the row's scroll-margin. Measured by hand rather
   * than scrollIntoView: iOS Safari's "nearest" stopped with row 9 of 10
   * behind the dock although the page could scroll further. innerHeight is
   * the viewport not covered by Safari's toolbars, which the dock sticks to.
   */
  useEffect(() => {
    const row = activeRowRef.current;
    if (!row) return;

    const { top, bottom } = row.getBoundingClientRect();
    const { scrollMarginTop, scrollMarginBottom } = getComputedStyle(row);
    const overshootBelow =
      bottom + parseFloat(scrollMarginBottom) - window.innerHeight;
    const overshootAbove = parseFloat(scrollMarginTop) - top;
    const distance =
      overshootBelow > 0 ? overshootBelow : -Math.max(0, overshootAbove);
    if (distance === 0) return;

    window.scrollBy({ top: distance, behavior: "smooth" });
  }, [guessCount]);

  /*
   * Rejected submit (Enter on an unfinished row): shake the active row. The
   * Web Animations API restarts on every call, which a CSS class can't do
   * without a remove/reflow/add dance.
   */
  useEffect(() => {
    const subscription = actor.on("rowIncomplete", () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      activeRowRef.current?.animate(ROW_SHAKE_KEYFRAMES, {
        duration: 280,
        easing: "ease-out",
      });
    });

    return () => subscription.unsubscribe();
  }, [actor]);

  return activeRowRef;
}
