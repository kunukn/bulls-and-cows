import { BULL_PATHS, BULL_VIEWBOX } from "./bullMark";

type Props = {
  className?: string;
};

/* Brand mark without the tile, in currentColor — sized by class (e.g. size-7). */
export function BullIcon({ className }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={BULL_VIEWBOX}
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      {BULL_PATHS.map(({ d, isEvenOdd }) => (
        <path key={d} d={d} fillRule={isEvenOdd ? "evenodd" : undefined} />
      ))}
    </svg>
  );
}
