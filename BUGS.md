# Bugs

Out-of-scope bugs found during development. Newest at the bottom.

2026-11-27
Component: scripts/generate-social-preview.ts (public/social-preview.png)
Expected: The link-share card states the current language count (14)
Actual: The card shows a hard-coded "7 languages" chip, visible under every shared daily result on X, Threads and Bluesky
Repro: Share a daily result to X; the link card reads "7 languages"
Workaround: none; fix the chip (or derive it from LANGUAGES) and run `pnpm social-preview`
