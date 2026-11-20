# 0008 — Auto check is on by default

- **Status:** Accepted
- **Updated:** 2026-11-20

## Context

The Auto check setting scores a guess as soon as the last peg is in. Without it, every player presses Check after each row, and a setting that starts off is one most players never find.

## Decision

The Auto check setting is on for new players.

## Alternatives considered

- **Off by default.** Gives a moment to review the row before it counts, but adds a tap to every guess for everyone.
- **Ask on first load.** One more dialog before the first game, for a choice the Settings drawer already offers.

## Consequences

- A misplaced last peg is scored at once; players who want to review first turn Auto check off in Settings, and the Check button works as before.
- Players who saved a choice keep it, because the whole settings object is saved.
- Guarded by `src/features/game/store/settings.test.ts` and the first-guess test in `e2e/game.spec.ts`.
