import { COLORS, type Color } from "@/features/game/logic";
import { useSettings } from "@/features/game/store/settings";
import { cn } from "@/utils/cn";
import { PegShape } from "./PegShape";
import { PEG_SIZE } from "./rowLayout";

/* Insert animations (keyframes in index.css); literal for Tailwind's scanner. */
export const PEG_INSERT_ANIMATIONS = [
  "motion-safe:animate-peg-pop",
  "motion-safe:animate-peg-drop",
  "motion-safe:animate-peg-ripple",
  "motion-safe:animate-peg-tip",
  "motion-safe:animate-peg-rattle",
] as const;

/*
 * Stable unsigned 32-bit hash of a placed peg. Integer hash (xorshift-multiply),
 * not a linear sum: a linear seed lines up with palette order, e.g. red, blue,
 * green, yellow all got one variant.
 */
export function hashPeg(rowNumber: number, slot: number, color: Color): number {
  let hash = (rowNumber * 31 + slot) * 31 + COLORS.indexOf(color);
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
  hash ^= hash >>> 16;

  return hash >>> 0;
}

/*
 * Varies the insert animation across slots without Math.random(): the same
 * slot and colour always get the same variant, so re-renders stay pure.
 */
export function pickInsertAnimation(
  rowNumber: number,
  slot: number,
  color: Color,
): string {
  return PEG_INSERT_ANIMATIONS[
    hashPeg(rowNumber, slot, color) % PEG_INSERT_ANIMATIONS.length
  ];
}

/* Literal class names so Tailwind's scanner picks them up. */
export const PEG_CLASS: Record<Color, string> = {
  red: "bg-peg-red",
  blue: "bg-peg-blue",
  green: "bg-peg-green",
  yellow: "bg-peg-yellow",
  purple: "bg-peg-purple",
  orange: "bg-peg-orange",
  pink: "bg-peg-pink",
  cyan: "bg-peg-cyan",
};

type Props = {
  color: Color | null;
  className?: string;
  /* For per-peg animation delays. */
  style?: React.CSSProperties;
};

export function Peg({ color, className, style }: Props) {
  const isPegShapes = useSettings((state) => state.isPegShapes);

  return (
    <span
      aria-hidden
      style={style}
      className={cn(
        PEG_SIZE,
        "grid place-items-center rounded-full",
        color
          ? cn(PEG_CLASS[color], "shadow-[inset_0_-3px_4px_rgb(0_0_0/0.35)]")
          : "bg-board-hole shadow-[inset_0_2px_4px_rgb(0_0_0/0.5)] ring-1 ring-board-hole-ring",
        className,
      )}
    >
      {color && isPegShapes && <PegShape color={color} className="size-3/5" />}
    </span>
  );
}
