# 0014 — Pegs can be shape only

- **Status:** Accepted
- **Date:** 2026-11-20

## Context

0005 added a shape to every colour peg as a backup for colour. Some players want to play with shape alone: as a harder challenge, or because hue gives them no help at all. The Shapes switch could only add shapes; it couldn't take colour away.

## Decision

The Shapes switch becomes a **Pegs** choice in Settings with three options: **Colour** (default), **Both** (colour + shape, the old Shapes on) and **Shape**. In Shape, every colour peg is the same ivory plastic with a thin dark ring. Only the moulded shape from 0005 tells the pegs apart, on the board, in the revealed code and on the palette buttons.

## Alternatives considered

- **A second Colours switch that appears when Shapes is on.** Two switches allow colour and shape both off, which leaves the pegs carrying no information, so the code would have to block it. One three-way choice can't reach that state. It is a segmented native radio group, like Appearance (0008).
- **Greyscale versions of the colours.** The colours differ in brightness (yellow is much lighter than blue), so greyscale still gives the colour away. That isn't shape only.
- **Hollow pegs (outline only).** An outlined circle reads as an empty hole (0005).
- **A dark neutral peg.** Blends into the dark boards; ivory stands out on every board, and the ring keeps it visible on Paper and in the light theme.

## Consequences

- Screen-reader labels still use colour names ("Add red"): colour stays the peg's identity in the game, and no shape names need translating.
- High scores don't record the peg style; Shape is a display choice like Shapes was.
- Saved settings migrate (persist v2): Shapes on becomes Both, off becomes Colour.
- `getPegClass()` in `src/features/game/components/Peg.tsx` is the one place that picks a peg's fill; use it for any new place that draws a colour peg.
