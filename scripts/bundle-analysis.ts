/*
 * Bundle analysis: builds the app into .temp/bundle-analysis/ and reports how
 * it splits into chunks.
 *
 *   pnpm analyze              treemap, opened in the browser
 *   pnpm analyze --no-open    treemap written, not opened (CI, SSH)
 *
 * Prints a per-file size table (raw, gzip, brotli) and writes an interactive
 * treemap to .temp/bundle-analysis/stats.html showing which modules land in
 * each chunk (`react`, `vendor`, the app chunk; see vite.config.ts).
 *
 * Builds outside dist/ so a real build is never overwritten and the report is
 * never deployed or precached by the service worker.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { brotliCompressSync, gzipSync } from "node:zlib";
import { visualizer } from "rollup-plugin-visualizer";
import { build } from "vite";

type FileSize = {
  file: string;
  raw: number;
  gzip: number;
  brotli: number;
};

const ROOT = join(import.meta.dirname, "..");
const REPORT_DIR = join(ROOT, ".temp", "bundle-analysis");
const OUT_DIR = join(REPORT_DIR, "dist");
const STATS_FILE = join(REPORT_DIR, "stats.html");
const MEASURED_EXTENSIONS = /\.(js|css|html)$/;
const isOpenEnabled = !process.argv.includes("--no-open");

await build({
  root: ROOT,
  logLevel: "warn",
  build: { outDir: OUT_DIR, emptyOutDir: true },
  plugins: [
    visualizer({
      filename: STATS_FILE,
      template: "treemap",
      title: "Tyr & Ko bundle",
      gzipSize: true,
      brotliSize: true,
      open: isOpenEnabled,
    }),
  ],
});

function listFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);

    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

function measureFile(path: string): FileSize {
  const content = readFileSync(path);

  return {
    file: relative(OUT_DIR, path),
    raw: content.length,
    gzip: gzipSync(content, { level: 9 }).length,
    brotli: brotliCompressSync(content).length,
  };
}

const formatKilobytes = new Intl.NumberFormat("en", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatSize(bytes: number): string {
  return `${formatKilobytes.format(bytes / 1024)} kB`;
}

const sizes = listFiles(OUT_DIR)
  .filter((path) => MEASURED_EXTENSIONS.test(path))
  .map(measureFile)
  .toSorted((first, second) => second.raw - first.raw);

const total = sizes.reduce(
  (sum, size) => ({
    file: "total",
    raw: sum.raw + size.raw,
    gzip: sum.gzip + size.gzip,
    brotli: sum.brotli + size.brotli,
  }),
  { file: "total", raw: 0, gzip: 0, brotli: 0 },
);

console.table(
  Object.fromEntries(
    [...sizes, total].map(({ file, raw, gzip, brotli }) => [
      file,
      {
        raw: formatSize(raw),
        gzip: formatSize(gzip),
        brotli: formatSize(brotli),
      },
    ]),
  ),
);
console.log(`Treemap: ${relative(ROOT, STATS_FILE)}`);
