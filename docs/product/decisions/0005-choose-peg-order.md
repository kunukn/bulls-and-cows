# 0005 — Players choose which hole a peg goes into

- **Status:** Accepted
- **Updated:** 2026-11-20

## Context

A player who is sure about the last colour but not the third shouldn't have to guess the third first, or fill it and clear it again. On a real board you push a peg into whichever hole you like.

## Decision

The active row has a **target hole**, lit with a ring of light. The next colour goes there.

- The target starts at the first hole, so ignoring the feature plays left to right.
- **Tap a hole** to target it. Tapping a placed peg targets it too, and the next colour replaces it. The × badge clears a peg.
- After a peg goes in, the target moves to the next empty hole to the right, wrapping round. A full row has no target, so the palette is disabled until a peg is tapped.
- **Undo removes the peg placed last**, wherever it sits. A replaced peg counts as placed last.
- Keyboard: ←/→ move the target (mirrored in right-to-left languages), digits place, Backspace undoes.

## Alternatives considered

- **Drag a colour onto a hole.** The most physical, but it needs custom pointer code that competes with scrolling on touch, and a tap fallback for accessibility anyway. It can be added on top later.
- **Pick the colour first, then tap the hole.** Clashes with tap-to-place on the palette: the same tap would mean two things.
- **Tap a placed peg to clear it.** Clearing stays on the × badge; replacing is the more common wish.

## Consequences

- The machine keeps `target` and `placed` (placement order) in its context. Saved games without them get them rebuilt as if filled left to right (`restorePlacement` in `persistence.ts`).
- The ring of light follows 0001: light on the board, no motion.
