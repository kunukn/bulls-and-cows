/*
 * itch.io upload: builds the game for itch's iframe and zips it.
 *
 *   pnpm itch:zip
 *
 * itch serves an HTML game from a subfolder inside an iframe with no SPA
 * fallback, so the build needs relative asset paths (`./`) and hash routing.
 * It is noindex like the GitHub Pages mirror. Builds into .temp/itch/dist so a
 * real `dist/` is never overwritten, then writes
 * .temp/tyrko-itch-<commit>.zip: itch shows the file name on its edit page,
 * and the same hash is in the Settings footer. Uncommitted changes add
 * "-dirty" to both.
 */
import { execFileSync } from "node:child_process";
import {
  existsSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { join, relative } from "node:path";
import { build } from "vite";

const ROOT = join(import.meta.dirname, "..");
const TEMP_DIR = join(ROOT, ".temp");
const OUT_DIR = join(TEMP_DIR, "itch", "dist");
// itch.io rejects HTML5 ZIPs over these limits.
const MAX_FILE_COUNT = 1000;
const MAX_EXTRACTED_BYTES = 500 * 1024 * 1024;

function runGit(...args: string[]): string {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

function listFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);

    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

const hash = runGit("rev-parse", "--short=7", "HEAD");
const isDirty = runGit("status", "--porcelain") !== "";
const version = isDirty ? `${hash}-dirty` : hash;
const zipPath = join(TEMP_DIR, `tyrko-itch-${version}.zip`);

if (isDirty) {
  console.warn(
    `Working tree has uncommitted changes: the build is tagged ${version}.`,
  );
}

// vite.config.ts reads these when the build loads it.
process.env.VITE_BASE_PATH = "./";
process.env.VITE_USE_HISTORY_ROUTING = "0";
process.env.VITE_ROBOTS_NOINDEX = "1";

await build({
  root: ROOT,
  logLevel: "warn",
  build: { outDir: OUT_DIR, emptyOutDir: true },
});

const indexHtml = readFileSync(join(OUT_DIR, "index.html"), "utf8");
if (/(src|href)="\/(?!\/)/.test(indexHtml)) {
  throw new Error("index.html has root-relative URLs; itch needs ./ paths.");
}

const files = listFiles(OUT_DIR).filter((path) => !path.endsWith(".DS_Store"));
const extractedBytes = files.reduce(
  (sum, path) => sum + statSync(path).size,
  0,
);
if (files.length > MAX_FILE_COUNT || extractedBytes > MAX_EXTRACTED_BYTES) {
  throw new Error(
    `Build exceeds itch.io limits: ${files.length} files, ${extractedBytes} bytes.`,
  );
}

// `zip` appends to an existing archive, which would keep stale chunks.
if (existsSync(zipPath)) rmSync(zipPath);

execFileSync("zip", ["-qrX", zipPath, ".", "-x", "*.DS_Store"], {
  cwd: OUT_DIR,
  stdio: "inherit",
});

const formatMegabytes = new Intl.NumberFormat("en", {
  maximumFractionDigits: 2,
});
const zipSize = formatMegabytes.format(statSync(zipPath).size / 1024 / 1024);
console.log(
  `${relative(ROOT, zipPath)} (${zipSize} MB, ${files.length} files)`,
);
