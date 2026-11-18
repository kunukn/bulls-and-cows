/*
 * Regenerates public/favicon.svg and public/apple-touch-icon.png from the
 * brand mark in src/components/icons/bullMark.ts. Needs ImageMagick 7 (`magick`).
 *
 *   pnpm icons
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import {
  BULL_VIEWBOX,
  TILE_COLOR,
  bullPathsMarkup,
} from "../src/components/icons/bullMark.ts";

function tileSvg(cornerRadius: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${BULL_VIEWBOX}"><rect width="32" height="32" rx="${cornerRadius}" fill="${TILE_COLOR}"/>${bullPathsMarkup()}</svg>\n`;
}

writeFileSync("public/favicon.svg", tileSvg(7));

/* iOS rounds the corners itself and fills transparency with black: square tile. */
mkdirSync("node_modules/.tmp", { recursive: true });
const appleSource = "node_modules/.tmp/apple-touch-icon.svg";
writeFileSync(appleSource, tileSvg(0));
execFileSync("magick", [
  "-background",
  "none",
  "-density",
  "600",
  appleSource,
  "-resize",
  "180x180",
  "-depth",
  "8",
  "-strip",
  "public/apple-touch-icon.png",
]);

console.log("Wrote public/favicon.svg and public/apple-touch-icon.png");
