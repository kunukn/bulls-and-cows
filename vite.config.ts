import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv, type PluginOption } from "vite";

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

  return {
    define: {
      "import.meta.env.VITE_APP_VERSION": JSON.stringify(buildStamp()),
    },
    /*
     * Local dev/preview use base `/`. The GitHub Pages deploy serves under
     * `/bulls-and-cows/`; the deploy workflow sets VITE_BASE_PATH to opt in.
     */
    base: process.env.VITE_BASE_PATH ?? "/",
    cacheDir: "node_modules/.vite",
    plugins: [
      await codeInspector(isCodeInspectorEnabled),
      tailwindcss(),
      react(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
  };
});
