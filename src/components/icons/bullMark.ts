/*
 * Brand mark: a symmetric line bull head drawn like a Lucide icon (24×24 grid,
 * 2px round stroke, no fill), so it sits in the same family as the header's nav
 * icons. Single source for the header icon (BullIcon) and the generated
 * favicon / apple-touch-icon (scripts/generate-icons.ts).
 */
export const BULL_VIEWBOX = "0 0 24 24";

export const BULL_STROKE_WIDTH = 2;

/*
 * Favicon / touch-icon colour: Tailwind slate-100, the app's text colour. In the
 * app, BullIcon uses currentColor instead, so it follows the surrounding text.
 */
export const BULL_COLOR = "#f1f5f9";

export const TILE_COLOR = "#0f172a";

/* Separate so the header bull can blink (BullIcon). */
export const BULL_EYE_PATHS = ["M10 11h.01", "M14 11h.01"];

export const BULL_PATHS: string[] = [
  // Horns, mirrored around x = 12.
  "M7 8C4.4 8 2.5 6.3 2.5 3.5",
  "M17 8c2.6 0 4.5-1.7 4.5-4.5",
  // Head narrowing into a rounded muzzle.
  "M7 8h10l-1.3 6.2c1.9.8 2.3 2.4 2.3 3.3 0 2-2.2 3.5-6 3.5s-6-1.5-6-3.5c0-.9.4-2.5 2.3-3.3Z",
  // Eyes and nostrils: zero-length segments drawn as dots by the round caps.
  ...BULL_EYE_PATHS,
  "M10.5 17.8h.01",
  "M13.5 17.8h.01",
];

/* Serialise to SVG markup, for the icon generator script. */
export function bullPathsMarkup(): string {
  const paths = BULL_PATHS.map((d) => `<path d="${d}"/>`).join("");

  return `<g fill="none" stroke="${BULL_COLOR}" stroke-width="${BULL_STROKE_WIDTH}" stroke-linecap="round" stroke-linejoin="round">${paths}</g>`;
}
