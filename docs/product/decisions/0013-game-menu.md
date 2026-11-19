# 0013 — New game and Give up share one menu

- **Status:** Accepted
- **Date:** 2026-11-19

## Context

The only way out of a game in progress was Give up, which reveals the code, or switching to another difficulty. The current difficulty could not be restarted. A separate New game button that appeared after the first peg shifted the info row and wrapped the bull/cow legend.

## Decision

The info row has one menu trigger, labelled Give up with a chevron, that opens New game and Give up. Menu items act at once; opening the menu is the confirmation. Switching difficulty mid-game still asks first, because it is a single tap on a radio.

## Alternatives considered

- **Re-tap the selected difficulty to restart.** A checked radio fires no change event and can't be reached by keyboard, and nobody would discover it.
- **Separate New game button with its own confirm dialog.** Causes the layout shift, and two buttons crowd the legend on narrow screens.
- **Icon-only (⋯) or "Game" trigger.** Hides Give up behind a vaguer label, and needs a new string in every locale.

## Consequences

- The info row looks the same before and after the first peg.
- New game is the first item, so a slip lands on the action that keeps the code secret.
- Guarded by the game menu test in `e2e/game.spec.ts`.
