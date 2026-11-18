import tailwindcss from "@tailwindcss/vite";
import pluginReact from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  /*
   * Local dev/preview use base `/`. The GitHub Pages deploy serves under
   * `/bulls-and-cows/`; the deploy workflow sets VITE_BASE_PATH to opt in.
   */
  base: process.env.VITE_BASE_PATH ?? "/",
  cacheDir: "node_modules/.vite",
  plugins: [tailwindcss(), pluginReact({ devTarget: "es2024" })],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
