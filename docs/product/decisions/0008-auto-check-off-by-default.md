# 0008 — Auto check is off by default

- **Status:** Accepted
- **Updated:** 2026-11-22

## Context

The Auto check setting scores a guess as soon as the last peg is in. A guess is the scarcest thing in the game, and a misplaced last peg scored at once costs one with no chance to fix it. New players are still learning the board and slip more often.

## Decision

The Auto check setting is off for new players: they press Check to score a row. Players who want speed turn Auto check on in Settings.

## Alternatives considered

- **On by default.** Saves a tap on every guess, but scores a misplaced last peg at once and hides the Check step the How to play help describes.
- **Ask on first load.** One more dialog before the first game, for a choice the Settings drawer already offers.

## Consequences

- Every guess takes one more tap (Check, or Enter) until the player turns Auto check on.
- Players who saved a choice keep it, because the whole settings object is saved.
- Guarded by `src/features/game/store/settings.test.ts` and the first-guess test in `e2e/game.spec.ts`.
