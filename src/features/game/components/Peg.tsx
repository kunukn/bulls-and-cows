import type { Color } from "@/features/game/logic";
import { cn } from "@/utils/cn";
import { PEG_SIZE } from "./rowLayout";

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
};

export function Peg({ color, className }: Props) {
  return (
    <span
      aria-hidden
      className={cn(
        PEG_SIZE,
        "block rounded-full",
        color
          ? cn(PEG_CLASS[color], "shadow-[inset_0_-3px_4px_rgb(0_0_0/0.35)]")
          : "bg-board-hole shadow-[inset_0_2px_4px_rgb(0_0_0/0.5)] ring-1 ring-board-hole-ring",
        className,
      )}
    />
  );
}
