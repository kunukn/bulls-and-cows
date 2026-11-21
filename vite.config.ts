import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv, type PluginOption } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { paths } from "./src/app/paths";

const SITE_ORIGIN = "https://www.tyrko.app";

/*
 * Dev-only click-to-source (code-inspector-plugin). Opt in with
 * VITE_CODE_INSPECTOR=1 in .env.local, then hold Option+Shift (macOS) /
 * Alt+Shift and click an element to open its source in the editor.
 *
 * Imported lazily, after the gate: loading @code-inspector/core runs
 * `git rev-parse` and pulls in several MB at module scope. Its terminal bridge
 * (an unauthenticated shell) stays off because the pnpm override in
 * pnpm-workspace.yaml removes node-pty from the dependency graph.
 */
async function codeInspector(isEnabled: boolean): Promise<PluginOption> {
  if (!isEnabled) return null;

  const { codeInspectorPlugin } = await import("code-inspector-plugin");

  return codeInspectorPlugin({
    bundler: "vite",
    /*
     * The helper server listens on all interfaces with wildcard CORS. `relative`
     * turns on its repo-root check, so a request cannot open arbitrary files.
     */
    pathType: "relative",
  });
}

/*
 * The GitHub Pages build mirrors tyrko.app. `noindex` keeps it from competing
 * with the main domain in search; deploy.yml sets VITE_ROBOTS_NOINDEX=1.
 */
function robotsNoindex(isEnabled: boolean): PluginOption {
  if (!isEnabled) return null;

  return {
    name: "robots-noindex",
    transformIndexHtml: () => [
      {
        tag: "meta",
        attrs: { name: "robots", content: "noindex" },
        injectTo: "head-prepend",
      },
    ],
  };
}

/*
 * sitemap.xml for www.tyrko.app, one entry per route in paths.ts. History
 * routing builds only: the GitHub Pages mirror uses hash URLs, which search
 * engines don't treat as separate pages, and is noindex anyway.
 * public/robots.txt points crawlers here.
 */
function sitemap(isEnabled: boolean): PluginOption {
  if (!isEnabled) return null;

  return {
    name: "sitemap",
    apply: "build",
    generateBundle() {
      const lastmod = new Date().toISOString().slice(0, 10);
      const urls = Object.values(paths)
        .map(
          (route) =>
            `  <url>\n    <loc>${SITE_ORIGIN}${route}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`,
        )
        .join("\n");
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      });
    },
  };
}

/* UTC build stamp shown in the Settings popover, e.g. `Y26-11-18_2127`. */
function buildStamp(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  const year = String(date.getUTCFullYear()).slice(2);
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const time = `${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}`;

  return `Y${year}-${month}-${day}_${time}`;
}

export default defineConfig(async ({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isCodeInspectorEnabled =
    command === "serve" &&
    ["1", "true"].includes(env.VITE_CODE_INSPECTOR?.toLowerCase());
  const historyRoutingFlag = process.env.VITE_USE_HISTORY_ROUTING ?? "1";

  return {
    define: {
      "import.meta.env.VITE_APP_VERSION": JSON.stringify(buildStamp()),
      // Vercel sets VERCEL=1 in its build environment (tyrko.app).
      "import.meta.env.VITE_IS_VERCEL_BUILD": JSON.stringify(
        process.env.VERCEL === "1",
      ),
      /*
       * "1" = history routing (default: dev, preview, Vercel). The GitHub
       * Pages workflow sets "0" for hash routing. Inlined as a literal so the
       * router choice is fixed at build time.
       */
      "import.meta.env.VITE_USE_HISTORY_ROUTING":
        JSON.stringify(historyRoutingFlag),
    },
    /*
     * Local dev/preview and Vercel use base `/` with history routing. The
     * GitHub Pages deploy serves under `/bulls-and-cows/` with hash routing;
     * the deploy workflow sets VITE_BASE_PATH and VITE_USE_HISTORY_ROUTING=0.
     */
    base: process.env.VITE_BASE_PATH ?? "/",
    cacheDir: "node_modules/.vite",
    build: {
      /*
       * Single ~620 kB app chunk (React, React Router, XState, i18next, Radix)
       * exceeds Vite's 500 kB default. Accepted on purpose: the PWA precaches
       * it once, so splitting isn't worth the extra config.
       */
      chunkSizeWarningLimit: 800,
    },
    plugins: [
      await codeInspector(isCodeInspectorEnabled),
      robotsNoindex(process.env.VITE_ROBOTS_NOINDEX === "1"),
      sitemap(historyRoutingFlag === "1"),
      tailwindcss(),
      react(),
      /*
       * Offline support: Workbox precaches the build (incl. sounds) and a new
       * deploy activates silently on the next load. Relative start_url/scope
       * keep it working under both `/` and the GitHub Pages subpath.
       */
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.svg", "apple-touch-icon.png"],
        manifest: {
          name: "Bulls & Cows",
          short_name: "Bulls & Cows",
          description:
            "Free Mastermind-style code-breaking game. Crack the secret colour code from bulls and cows clues.",
          categories: ["games", "puzzle"],
          theme_color: "#0f172a",
          background_color: "#0f172a",
          display: "standalone",
          start_url: "./",
          scope: "./",
          icons: [
            {
              src: "icons/pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "icons/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "icons/pwa-512x512-maskable.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,svg,png,wav,mp3}"],
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
  };
});
