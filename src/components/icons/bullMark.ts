/*
 * Brand mark: a flat bull head on a 32×32 grid. Single source for the header
 * icon (BullIcon) and the generated favicon / apple-touch-icon
 * (scripts/generate-icons.ts). The eyes are a red and a blue game peg.
 */
export const BULL_VIEWBOX = "0 0 32 32";

export const TILE_COLOR = "#0f172a";

type Shape =
  | { tag: "path"; d: string; fill: string }
  | { tag: "circle"; cx: number; cy: number; r: number; fill: string }
  | {
      tag: "ellipse";
      cx: number;
      cy: number;
      rx: number;
      ry: number;
      fill: string;
    };

const HORN = "#f5e6c8";

export const BULL_SHAPES: Shape[] = [
  {
    tag: "path",
    d: "M11 12.5C7 12.5 3.5 10 3.5 4.5 5.5 8 8.5 9 12 9.5Z",
    fill: HORN,
  },
  {
    tag: "path",
    d: "M21 12.5C25 12.5 28.5 10 28.5 4.5 26.5 8 23.5 9 20 9.5Z",
    fill: HORN,
  },
  {
    tag: "path",
    d: "M10.5 9.5H21.5C23.3 9.5 24.3 10.7 24 12.5L22.6 21.5C22.1 25.2 19.8 27.5 16 27.5S9.9 25.2 9.4 21.5L8 12.5C7.7 10.7 8.7 9.5 10.5 9.5Z",
    fill: "#b45309",
  },
  { tag: "ellipse", cx: 16, cy: 23, rx: 5, ry: 3.6, fill: "#f59e0b" },
  { tag: "circle", cx: 12.6, cy: 15.5, r: 1.7, fill: "#ef4444" },
  { tag: "circle", cx: 19.4, cy: 15.5, r: 1.7, fill: "#3b82f6" },
  { tag: "circle", cx: 14.3, cy: 23, r: 0.9, fill: TILE_COLOR },
  { tag: "circle", cx: 17.7, cy: 23, r: 0.9, fill: TILE_COLOR },
];

/* Serialise to SVG markup, for the icon generator script. */
export function bullShapesMarkup(): string {
  return BULL_SHAPES.map(({ tag, ...attrs }) => {
    const attributes = Object.entries(attrs)
      .map(([key, value]) => `${key}="${value}"`)
      .join(" ");

    return `<${tag} ${attributes}/>`;
  }).join("");
}
