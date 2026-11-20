/*
 * Regenerates the favicon, apple-touch-icon and PWA icons from the brand mark
 * in src/components/icons/bullMark.ts. Needs ImageMagick 7 (`magick`).
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

type Tile = {
  cornerRadius: number;
  // Edge length of the 24×24 mark on the 32×32 tile.
  markSize: number;
};

const ROUNDED: Tile = { cornerRadius: 7, markSize: 26 };

/* iOS rounds the corners itself and fills transparency with black: square tile. */
const SQUARE: Tile = { cornerRadius: 0, markSize: 26 };

/*
 * Android crops maskable icons to any shape inside a centred circle of 80% of
 * the width, so the whole mark (horn tips included) has to fit inside it.
 */
const MASKABLE: Tile = { cornerRadius: 0, markSize: 20 };

function tileSvg({ cornerRadius, markSize }: Tile): string {
  const offset = (32 - markSize) / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="${cornerRadius}" fill="${TILE_COLOR}"/><svg x="${offset}" y="${offset}" width="${markSize}" height="${markSize}" viewBox="${BULL_VIEWBOX}">${bullPathsMarkup()}</svg></svg>\n`;
}

mkdirSync("node_modules/.tmp", { recursive: true });

function writePng(tile: Tile, size: number, output: string) {
  const source = "node_modules/.tmp/icon.svg";
  writeFileSync(source, tileSvg(tile));
  execFileSync("magick", [
    "-background",
    "none",
    "-density",
    "1200",
    source,
    "-resize",
    `${size}x${size}`,
    "-depth",
    "8",
    "-strip",
    output,
  ]);
}

const outputs: string[] = ["public/favicon.svg"];
writeFileSync("public/favicon.svg", tileSvg(ROUNDED));

const pngs: [Tile, number, string][] = [
  [SQUARE, 180, "public/apple-touch-icon.png"],
  [ROUNDED, 192, "public/icons/pwa-192x192.png"],
  [ROUNDED, 512, "public/icons/pwa-512x512.png"],
  [MASKABLE, 512, "public/icons/pwa-512x512-maskable.png"],
];
for (const [tile, size, output] of pngs) {
  writePng(tile, size, output);
  outputs.push(output);
}

console.log(`Wrote ${outputs.join(", ")}`);
