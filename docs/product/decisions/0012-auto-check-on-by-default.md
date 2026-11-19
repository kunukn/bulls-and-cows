# 0012 — Auto check is on by default

- **Status:** Accepted
- **Date:** 2026-11-19

## Context

The Auto check setting scores a guess as soon as the last peg is in. It was off by default, so every new player had to press Check after each row, and most never found the setting.

## Decision

The Auto check setting is on for new players.

## Alternatives considered

- **Keep it off.** Gives a moment to review the row before it counts, but adds a tap to every guess for everyone.
- **Ask on first load.** One more dialog before the first game, for a choice the Settings drawer already offers.

## Consequences

- A misplaced last peg is scored at once; players who want to review first turn Auto check off in Settings, and the Check button works as before.
- Players who have opened the game before keep their saved choice (off, unless they turned it on), because the whole settings object is saved.
- Guarded by `src/features/game/store/settings.test.ts` and the first-guess test in `e2e/game.spec.ts`.
