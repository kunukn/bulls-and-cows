import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  /*
   * Local dev/preview use base `/`. The GitHub Pages deploy serves under
   * `/bulls-and-cows/`; the deploy workflow sets VITE_BASE_PATH to opt in.
   */
  base: process.env.VITE_BASE_PATH ?? "/",
  cacheDir: "node_modules/.vite",
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
