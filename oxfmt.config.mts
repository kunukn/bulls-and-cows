import { defineConfig } from "oxfmt";

/**
 * Oxfmt config. Formats the whole repo; `pnpm-lock.yaml` is always ignored.
 */
export default defineConfig({
  // Prettier's default; Oxfmt's own is 100.
  printWidth: 80,
  // Same algorithm as prettier-plugin-tailwindcss.
  sortTailwindcss: {
    // Tailwind v4 entry, so the custom @theme peg colours sort correctly.
    stylesheet: "./src/index.css",
    functions: ["cn", "clsx"],
  },
});
