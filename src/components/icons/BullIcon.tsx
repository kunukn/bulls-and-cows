import {
  BULL_EYE_PATHS,
  BULL_PATHS,
  BULL_STROKE_WIDTH,
  BULL_VIEWBOX,
} from "./bullMark";

/*
 * Each eye closes about its own centre. A character, not a board piece, so
 * the squash that 0001 rules out for pegs is just an eyelid here.
 */
const EYE_BLINK_CLASS =
  "origin-center [transform-box:fill-box] motion-safe:animate-bull-blink";

type Props = {
  className?: string;
  /* Blinks now and then; for the living header bull, not the moulded one. */
  shouldBlink?: boolean;
};

/* Brand mark without the tile, in currentColor — sized by class (e.g. size-7). */
export function BullIcon({ className, shouldBlink }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={BULL_VIEWBOX}
      fill="none"
      stroke="currentColor"
      strokeWidth={BULL_STROKE_WIDTH}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {BULL_PATHS.map((d) => (
        <path
          key={d}
          d={d}
          className={
            shouldBlink && BULL_EYE_PATHS.includes(d)
              ? EYE_BLINK_CLASS
              : undefined
          }
        />
      ))}
    </svg>
  );
}
