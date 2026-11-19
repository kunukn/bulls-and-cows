/*
 * Brand mark: a flat, symmetric bull head in one colour on a 32×32 grid. Eyes
 * and nostrils are holes in the head (even-odd fill), so they show whatever is
 * behind the mark. Single source for the header icon (BullIcon) and the
 * generated favicon / apple-touch-icon (scripts/generate-icons.ts).
 */
export const BULL_VIEWBOX = "0 0 32 32";

/*
 * Favicon / touch-icon colour: Tailwind slate-100, the app's text colour. In the
 * app, BullIcon uses currentColor instead, so it always matches adjacent text.
 */
export const BULL_COLOR = "#f1f5f9";

export const TILE_COLOR = "#0f172a";

type BullPath = { d: string; isEvenOdd?: boolean };

export const BULL_PATHS: BullPath[] = [
  // Horns, mirrored around x = 16.
  { d: "M11 12.5C7 12.5 3.5 10 3.5 4.5 5.5 8 8.5 9 12 9.5Z" },
  { d: "M21 12.5C25 12.5 28.5 10 28.5 4.5 26.5 8 23.5 9 20 9.5Z" },
  // Head, with eye and nostril holes as extra circular subpaths.
  {
    d: "M10.5 9.5H21.5C23.3 9.5 24.3 10.7 24 12.5L22.6 21.5C22.1 25.2 19.8 27.5 16 27.5S9.9 25.2 9.4 21.5L8 12.5C7.7 10.7 8.7 9.5 10.5 9.5ZM10.6 15.5a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M17.4 15.5a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M12.9 22.6a1.1 1.1 0 1 0 2.2 0a1.1 1.1 0 1 0 -2.2 0M16.9 22.6a1.1 1.1 0 1 0 2.2 0a1.1 1.1 0 1 0 -2.2 0",
    isEvenOdd: true,
  },
];

/* Serialise to SVG markup, for the icon generator script. */
export function bullPathsMarkup(): string {
  return BULL_PATHS.map(
    ({ d, isEvenOdd }) =>
      `<path d="${d}" fill="${BULL_COLOR}"${isEvenOdd ? ' fill-rule="evenodd"' : ""}/>`,
  ).join("");
}
