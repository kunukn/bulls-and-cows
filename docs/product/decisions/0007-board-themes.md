# 0007 — Six board themes, each clearly different

- **Status:** Accepted
- **Updated:** 2026-11-20

## Context

Board themes let players pick the look of the board. Every swatch in the picker should be a real choice, and the set should serve light-mode players and younger players as well as the default dark look.

## Decision

There are six themes, each with its own hue or lightness: Neon (navy, the default), Classic (black plastic), Felt (green), Wood (brown), Paper (white) and Candy (pastel). A theme is chosen on its own and is not tied to light mode (0006).

- **Classic** is the plain peg-board look.
- **Felt** is green card-table felt with a soft vignette, faint fibres and gold trim.
- **Paper** is graph paper in slate and sky, the light counterpart of Neon.
- **Candy** is aimed at younger players: a pastel lavender-to-mint surface with sprinkle dots, white holes and an amber active row. It is light like Paper and leaves out pink, so pink bulls still stand out.

## Alternatives considered

- **Metal** (dark grey brushed metal). Differed from Classic only by a little lightness and a faint stripe; one slot gave players no real choice.
- **Aluminium** (light silver). Sits close to Paper.
- **Switch the board with light mode.** Would override a theme the player picked; the board and the interface stay independent.
- **Make each theme light-aware.** Every theme to re-tune and test twice, for little gain.
- **Playroom (saturated toy blue).** Blue and cyan pegs blend into a blue board.
- **Chalkboard.** School feel, but another dark board.

## Consequences

- White cow pegs get an outline from a `--board-cow-ring` token, transparent on the dark themes.
- Board shadows come from tokens so the light boards don't look heavy: `--board-drop` (board) and `--board-shield-drop` (secret shield) are black at 40% on dark themes and a faint slate on Paper, violet on Candy; `--board-hole-shade` (hole inset) is black at 50% on dark themes and 25% on Paper and Candy.
- On Paper, holes are slate with a darker rim and inset shadow, so they read as holes, not dots. On Candy they are opaque so sprinkles stay out of them.
- Pegs stand out on Candy because the board is much lighter than they are, even where the hue is close (the purple peg on lavender).
- Candy's sprinkles are layered CSS gradients in `--board-surface`, no images.
- The green peg is a little lower in contrast on Felt than elsewhere; the felt is dark enough (green-800 → green-950) that it still lifts off.
- The settings store migrates a saved `"gunmetal"` (Metal) to `"felt"`; without it, those players would get a board with no theme tokens. A unit test covers it.
