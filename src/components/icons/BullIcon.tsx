import { BULL_SHAPES, BULL_VIEWBOX } from "./bullMark";

type Props = {
  className?: string;
};

/* Brand mark without the tile, in its own colours — sized by class (e.g. size-6). */
export function BullIcon({ className }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={BULL_VIEWBOX}
      aria-hidden="true"
      className={className}
    >
      {BULL_SHAPES.map(({ tag: Tag, ...attrs }, index) => (
        <Tag key={index} {...attrs} />
      ))}
    </svg>
  );
}
