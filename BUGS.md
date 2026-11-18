# Bugs

Out-of-scope bugs found during development. Newest at the bottom.

2026-11-18
Component: vite.config.ts (production bundle)
Expected: the app JavaScript is split so no chunk exceeds Vite's 500 kB default warning limit, and first load fetches less code.
Actual: one ~522 kB chunk (gzip ~167 kB) holds the app plus React, React Router, XState, i18next and Radix; `build.chunkSizeWarningLimit` is raised to 650 kB to silence the warning.
Repro: `pnpm build` (with the limit back at 500 the "Some chunks are larger than 500 kB" warning appears).
Workaround: limit raised. Future work: vendor chunks via `build.rolldownOptions.output.codeSplitting.groups` (Rolldown; `manualChunks` is deprecated), and/or lazy-load the Settings drawer (Radix Dialog) on first open.

2026-11-18
Component: shadcn CLI (`pnpm dlx shadcn@latest add <name>`), components.json
Expected: Added components import `cn` from the `utils` alias `@/utils/cn`
Actual: The CLI writes `import { cn } from "cn"` and installs the unrelated npm package `cn` as a dependency
Repro: Run `pnpm dlx shadcn@latest add switch` and inspect the new file and package.json
Workaround: Change the import to `@/utils/cn` and run `pnpm remove cn`
