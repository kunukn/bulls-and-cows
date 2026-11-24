# Bugs

Out-of-scope bugs found during development. Newest at the bottom.

2026-11-20
Component: src/features/game/components/GuessRow.tsx (Candy board theme)
Expected: Candy holes stay opaque so sprinkles don't show inside them (decision 0007)
Actual: Upcoming rows put `opacity-60` on the whole pegs column (line 63), so the opaque holes turn 60% see-through and the board's sprinkles show inside every hole below the active row
Repro: Settings → Board theme → Candy; look at the holes in rows 2–10
Workaround: none

2026-11-24
Component: e2e/daily.spec.ts ("share copies the result without the code")
Expected: The post-link check expects Threads' text with ● ◎ ○ symbols (since 0326f09) and emoji for X and Bluesky
Actual: It expects the clipboard's emoji text for all three sites, so the Threads link fails (⚫⚫⚫⚫ vs ●●●●)
Repro: pnpm e2e e2e/daily.spec.ts
Workaround: none
