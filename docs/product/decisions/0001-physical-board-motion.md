# 0001 — Motion follows a physical board

- **Status:** Accepted
- **Updated:** 2026-11-20

## Context

The board imitates a physical code-breaking board game: plastic pegs pushed into holes, small key pegs for feedback, and a hidden code at one end of the board. Animations that no real object could perform break that illusion: a squash-and-stretch insert makes pegs look like jelly, and a peg rotated edge-on vanishes to a sliver where a solid peg would still show its side.

## Decision

Every animation shows something the physical game could do: pegs and covers are rigid bodies that move, tilt, drop, settle and catch light, but never squash, stretch, bend, or turn paper-thin. The name for this approach is skeuomorphic motion: a real-world metaphor with honest materials ("truth to materials").

- **Allowed:** translate; small tilts, with `perspective()` so they foreshorten like a real tilt; settling wobble; uniform scale that reads as moving towards or away from the viewer (lifted, then pushed into the hole); light effects such as a highlight or glint on glossy plastic.
- **Not allowed:** non-uniform scale (squash and stretch); rotations that turn a solid peg edge-on so it vanishes; objects growing out of nothing with no source.
- **Reveals use what the game uses.** The physical code is hidden behind a hinged shield, so the reveal moves the shield (it lifts on its hinge or slides away) rather than the pegs.

## Alternatives considered

- **Cartoon motion** (squash and stretch, elastic overshoot, flips). Lively and common in casual games, but it tells the player the pieces are rubber and works against the board-game look.
- **Card-style flip of the secret pegs** (180°, or 90° to 0°). A familiar way to reveal something in UI, but card games have flat cards and this game does not. A peg turned edge-on would not vanish.
- **Flat, no motion.** Honest, but placing a peg has no feel, and the win and reveal moments go unmarked.

## Consequences

- The secret reveal is a hinged shield (`src/features/game/components/SecretShield.tsx`) that lifts towards the viewer. The plate has an edge face, so when it stands upright it shows its thickness rather than vanishing. It closes again on a new game.
- Peg inserts use tip-in and rattle variants.
- `peg-pop` (from `scale(0.4)`) and `feedback-pop` (from `scale(0)`) sit on the edge: they read as dropping in only if the start is close enough to full size. Review them when touching the insert animations.
- `motion-safe:` stays on every animation; reduced motion shows the end state at once.
- New animations are judged with one question: could a plastic peg or board piece do this?
