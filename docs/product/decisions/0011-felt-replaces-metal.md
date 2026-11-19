# 0011 — Felt replaces the Metal board theme

- **Status:** Accepted
- **Date:** 2026-11-19

## Context

Classic (black plastic) and Metal (dark grey brushed metal) were both dark and colourless. In the theme picker they differed only by a little lightness and a faint stripe, so one of the six slots gave players no real choice.

## Decision

Metal is removed and Felt takes its slot: green card-table felt with a soft vignette, faint fibres and gold trim. Classic stays as the plain peg-board look.

## Alternatives considered

- **Re-tune Metal as light Aluminium.** No migration needed, but light silver sits close to Paper (0009).
- **Keep both.** Two near-identical swatches.

## Consequences

- Every swatch now has its own hue or lightness: navy, black, green, brown, white, pastel.
- Saved settings are migrated: the settings store is at version 1, and a saved `"gunmetal"` becomes `"felt"`. Without this, those players would get a board with no theme tokens at all. A unit test covers it.
- The green peg is a little lower in contrast on Felt than elsewhere; the felt is dark enough (green-800 → green-950) that it still lifts off.
