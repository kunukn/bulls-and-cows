# Bugs

Out-of-scope bugs found during development. Newest at the bottom.

2026-11-18
Component: vite.config.ts (production bundle)
Expected: the app JavaScript is split so no chunk exceeds Vite's 500 kB default warning limit, and first load fetches less code.
Actual: one ~568 kB chunk (gzip ~183 kB) holds the app plus React, React Router, XState, i18next and Radix; `build.chunkSizeWarningLimit` is raised to 650 kB to silence the warning.
Repro: `pnpm build` (with the limit back at 500 the "Some chunks are larger than 500 kB" warning appears).
Workaround: limit raised. Future work: vendor chunks via `build.rolldownOptions.output.codeSplitting.groups` (Rolldown; `manualChunks` is deprecated), and/or lazy-load the Settings popover (Radix) on first open.
