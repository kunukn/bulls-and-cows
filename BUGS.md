# Bugs

Out-of-scope bugs found during development. Newest at the bottom.

```text
2026-11-26
Component: e2e/game.spec.ts — "the Swap badge marks a swap-mode game from the next game on"
Expected: `pnpm e2e` passes.
Actual: The test fails at `expect(badge).toBeHidden()`. It turns "AI can swap colours" on before any guess and expects no badge, but since 4d23745 the switch also changes a game before its first guess, so the badge shows at once.
Repro: `pnpm e2e e2e/game.spec.ts -g "Swap badge"`
Workaround: none; the test needs a checked guess before the switch is flipped.
```
