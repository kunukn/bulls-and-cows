# 0009 — New game and Give up share one menu

- **Status:** Accepted
- **Updated:** 2026-11-20

## Context

A player needs two ways out of a game in progress: start over on the same difficulty, or give up and see the code. Neither should shift the info row or wrap the bull/cow legend when it appears.

## Decision

The info row has one menu trigger, labelled Give up with a chevron, that opens New game and Give up. Menu items act at once; opening the menu is the confirmation. Switching difficulty mid-game asks first, because it is a single tap on a radio.

## Alternatives considered

- **Re-tap the selected difficulty to restart.** A checked radio fires no change event and can't be reached by keyboard, and nobody would discover it.
- **Separate New game button with its own confirm dialog.** Appearing after the first peg shifts the layout, and two buttons crowd the legend on narrow screens.
- **Icon-only (⋯) or "Game" trigger.** Hides Give up behind a vaguer label, and needs a new string in every locale.

## Consequences

- The info row looks the same before and after the first peg.
- New game is the first item, so a slip lands on the action that keeps the code secret.
- Guarded by the game menu test in `e2e/game.spec.ts`.
