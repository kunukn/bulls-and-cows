import { defineConfig } from "oxlint";

/**
 * Oxlint config. TypeScript (.mts, so Node loads it as ESM) rather than JSON.
 *
 * Run from the repo root (`pnpm lint`, pre-push and CI all do):
 * better-tailwindcss resolves `entryPoint` against the working directory.
 */

/** Framework and tool entry files, where a default export is the convention. */
const defaultExportRequired = ["*.config.{ts,mts}"];

export default defineConfig({
  plugins: [
    "typescript",
    "unicorn",
    "oxc",
    "react",
    "import",
    "jsx-a11y",
    "vitest",
  ],
  // JS plugin API is alpha: pinned exactly with oxlint, bump them together.
  jsPlugins: ["eslint-plugin-better-tailwindcss"],
  settings: {
    "better-tailwindcss": { entryPoint: "src/index.css" },
  },
  categories: { correctness: "error" },
  rules: {
    "react/rules-of-hooks": "error",
    "react/self-closing-comp": "error",
    // `x != null` is the deliberate "null or undefined" check.
    eqeqeq: ["error", "always", { null: "ignore" }],
    "no-console": ["error", { allow: ["error", "warn"] }],
    "no-debugger": "error",
    "no-var": "error",
    "prefer-const": "error",
    "no-nested-ternary": "error",
    "import/no-cycle": "error",
    "import/no-self-import": "error",
    "import/no-default-export": "error",
    "typescript/ban-ts-comment": "error",
    "unicorn/no-array-for-each": "error",
    "vitest/no-focused-tests": "error",
    "better-tailwindcss/no-unknown-classes": "error",
  },
  overrides: [
    {
      files: defaultExportRequired,
      rules: { "import/no-default-export": "off" },
    },
    // CLI scripts: console output is the point.
    { files: ["scripts/**"], rules: { "no-console": "off" } },
  ],
  ignorePatterns: [
    // Vendored third-party CSS debugging helper (Alt+Shift+R), kept verbatim.
    "public/rainbow.js",
  ],
});
