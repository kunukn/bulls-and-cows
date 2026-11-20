import type { Color } from "@/features/game/logic";
import { cn } from "@/utils/cn";

/*
 * One silhouette per colour (24×24 box), so colours can be told apart without
 * seeing hue. Pairs that colour-blind players mix up get the most different
 * outlines: red ▲ / green ✚, cyan ♥ / blue ◆, blue ◆ / purple ☾,
 * purple ☾ / pink 💧. A colour keeps its shape on every difficulty, even
 * where its digit differs.
 */
const SHAPE_PATHS: Record<Color, string> = {
  // Raised 1 unit: halfway between box-centred and centroid-centred.
  red: "M12 2.5 20.5 18H3.5z",
  orange: "M5 5h14v14H5z",
  yellow:
    "M12 3l2.35 6.26 6.69.3-5.24 4.18 1.78 6.45L12 16.5l-5.58 3.69 1.78-6.45-5.24-4.18 6.69-.3z",
  green: "M9.5 4h5v5.5H20v5h-5.5V20h-5v-5.5H4v-5h5.5z",
  cyan: "M12 21s-9-5.5-9-11.5a4.5 4.5 0 0 1 9-1.5 4.5 4.5 0 0 1 9 1.5C21 15.5 12 21 12 21z",
  blue: "M12 3 21 12 12 21 3 12z",
  purple: "M17 3.8a8.5 8.5 0 1 0 0 16.4 9.5 9.5 0 0 1 0-16.4z",
  pink: "M12 3c-3 4.5-6.5 8-6.5 11.5a6.5 6.5 0 0 0 13 0C18.5 11 15 7.5 12 3z",
};

type Props = {
  color: Color;
  className?: string;
};

/*
 * A shape moulded into the peg head (0001: honest plastic, no printed icon).
 * Drawn as a recess: dark fill, with a light lower lip where the cut edge
 * catches the light.
 */
export function PegShape({ color, className }: Props) {
  const path = SHAPE_PATHS[color];

  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={cn("pointer-events-none", className)}
    >
      <path
        d={path}
        transform="translate(0 0.9)"
        fill="rgb(255 255 255 / 0.55)"
        strokeLinejoin="round"
      />
      <path
        d={path}
        fill="rgb(0 0 0 / 0.55)"
        stroke="rgb(0 0 0 / 0.3)"
        strokeWidth={0.75}
        strokeLinejoin="round"
      />
    </svg>
  );
}
