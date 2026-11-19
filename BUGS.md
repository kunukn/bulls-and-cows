# Bugs

Out-of-scope bugs found during development. Newest at the bottom.

2026-11-19
Component: scripts/pre-push-checks.js (`pnpm check`)
Expected: `pnpm check` catches the type errors that fail `pnpm build`
Actual: It typechecks only `tsconfig.app.json`; `tsconfig.node.json` (e2e, configs) is checked only by `tsc -b` in `pnpm build`. A `getComputedStyle` call in `e2e/game.spec.ts` (5016dcc) broke the build while `pnpm check` passed
Repro: Add a type error to `e2e/game.spec.ts`, run `pnpm check` (passes) then `pnpm build` (fails)
Workaround: Run `pnpm build` before pushing
