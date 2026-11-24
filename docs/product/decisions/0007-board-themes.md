# 0007 — Six board themes, each clearly different

- **Status:** Accepted
- **Updated:** 2026-11-22

## Context

Board themes let players pick the look of the board. Every swatch in the picker should be a real choice, and the set should serve light-mode players and younger players as well as the default dark look.

## Decision

There are six themes, each with its own hue or lightness: Neon (navy, the default), Classic (black plastic), Felt (green), Wood (brown), Paper (white) and Candy (pastel). A theme is chosen on its own and is not tied to light mode (0006).

- **Classic** is the plain peg-board look: dark moulded plastic with no texture, only a faint diagonal sheen so it reads as glossy rather than flat.
- **Felt** is green card-table felt with a soft vignette, faint fibres, a fine fuzz and gold trim.
- **Wood** is an amber plank with dark grain running the length of the board, a little darker at the edges. The secret shield has the same grain, slightly faded, so it reads as a wooden lid. Candy's shield has its own stripes (see Candy); the rest keep a plain shield, a separate piece from the patterned board.
- **Paper** is graph paper in slate and sky, the light counterpart of Neon.
- **Candy** is aimed at younger players: a pastel lavender-to-mint surface with sprinkle dots, white holes, an amber active row and a hard-candy secret shield (glossy top half over soft white wrapper stripes). It is light like Paper and leaves out pink, so pink bulls still stand out.

## Alternatives considered

- **Metal** (dark grey brushed metal). Differed from Classic only by a little lightness and a faint stripe; one slot gave players no real choice.
- **Aluminium** (light silver). Sits close to Paper.
- **Switch the board with light mode.** Would override a theme the player picked; the board and the interface stay independent.
- **Make each theme light-aware.** Every theme to re-tune and test twice, for little gain.
- **Playroom (saturated toy blue).** Blue and cyan pegs blend into a blue board.
- **Chalkboard.** School feel, but another dark board.

## Consequences

- Bull and cow pegs share one outline from a `--board-key-ring` token, in a colour that stands out from the board (light on dark themes, slate on Paper, violet on Candy), so both look the same size on every board.
- Board shadows come from tokens so the light boards don't look heavy: `--board-drop` (board) and `--board-shield-drop` (secret shield) are black at 40% on dark themes and a faint slate on Paper, violet on Candy; `--board-hole-shade` (hole inset) is black at 50% on dark themes and 25% on Paper and Candy.
- On Paper, holes are slate with a darker rim and inset shadow, so they read as holes, not dots. On Candy they are opaque so sprinkles stay out of them.
- Rows not reached yet recede. On most themes their holes fade to 60%; fading would let Candy's sprinkles through, so there they stay opaque in a slightly darker lavender (`--board-upcoming-opacity`, `--board-hole-upcoming`).
- Pegs stand out on Candy because the board is much lighter than they are, even where the hue is close (the purple peg on lavender).
- Candy's sprinkles are layered CSS gradients in `--board-surface`, no images.
- Wood's grain is an inline SVG `feTurbulence` noise (a `data:` URI in `--board-surface`), stretched along one axis so it reads as grain; no image file. Plain gradients only gave stripes.
- Felt's fuzz uses the same SVG noise, fine and with no direction, as dark specks only; grey specks washed the green out.
- The green peg is a little lower in contrast on Felt than elsewhere; the felt is dark enough (green-800 → green-950) that it still lifts off.
- The settings store migrates a saved `"gunmetal"` (Metal) to `"felt"`; without it, those players would get a board with no theme tokens. A unit test covers it.
