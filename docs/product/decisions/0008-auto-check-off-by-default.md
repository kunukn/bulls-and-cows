# 0008 — Auto check is off by default

- **Status:** Accepted
- **Updated:** 2026-11-26

## Context

The Auto check setting scores a guess as soon as the last peg is in. A guess is the scarcest thing in the game, and a misplaced last peg scored at once costs one with no chance to fix it. New players are still learning the board and slip more often.

## Decision

The Auto check setting is off for new players: they press Check to score a row. Players who want speed turn Auto check on in Settings.

With Auto check on, a full row is always checked. The last peg checks it, and so does switching the setting on over a full row, or opening the game with one. That leaves nothing for the Check button to do, so it is hidden and Undo sits alone, centred.

## Alternatives considered

- **On by default.** Saves a tap on every guess, but scores a misplaced last peg at once.
- **Keep Check on screen with Auto check on.** It stays disabled except for the moment before the auto check, so it flickers on every guess and looks like a step the player has to take.
- **Leave a full row unchecked when the setting is switched on, and bring Check back for it.** The buttons jump when the switch flips, and Check needs a place kept beside Undo that pushes Undo off-centre on narrow phones.

## Consequences

- Every guess takes one more tap (Check, or Enter) until the player turns Auto check on.
- Players who saved a choice keep it, because the whole settings object is saved.
- Switching Auto check on over a full row scores it at once, behind the Settings drawer, with no chance to fix it first.
- How to play describes the mode in use: "Press Check" with Auto check off, checked when the row is full with it on.
- Guarded by `src/features/game/store/settings.test.ts`, and by the first-guess and Auto check tests in `e2e/game.spec.ts`.
