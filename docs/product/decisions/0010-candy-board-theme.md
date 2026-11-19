# 0010 — A child-friendly board theme: Candy

- **Status:** Accepted
- **Date:** 2026-11-19

## Context

The board themes were four dark ones and one pale one (Paper, 0009). None was colourful or aimed at younger players, who are part of the audience (see the translation tone rules).

## Decision

A sixth board theme, Candy: a pastel lavender-to-mint surface with sprinkle dots, white holes and an amber active row. It is light like Paper and leaves out pink, so pink bulls still stand out.

## Alternatives considered

- **Playroom (saturated toy blue).** Blue and cyan pegs blend into a blue board.
- **Felt (green card table).** Grown-up, and another dark board.
- **Chalkboard.** School feel, but another dark board.

## Consequences

- Pegs stand out on Candy because the board is much lighter than they are, even where the hue is close (the purple peg on lavender).
- Holes are opaque so sprinkles stay out of them; cows use the `--board-cow-ring` outline from 0009.
- Sprinkles are layered CSS gradients in `--board-surface`, no images.
