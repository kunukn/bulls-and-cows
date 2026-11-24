# Bugs

Out-of-scope bugs found during development. Newest at the bottom.

2026-11-24
Component: e2e/daily.spec.ts ("share copies the result without the code")
Expected: The post-link check expects Threads' text with ● ◎ ○ symbols (since 0326f09) and emoji for X and Bluesky
Actual: It expects the clipboard's emoji text for all three sites, so the Threads link fails (⚫⚫⚫⚫ vs ●●●●)
Repro: pnpm e2e e2e/daily.spec.ts
Workaround: none
