# 0005 — Colours can carry a shape too

- **Status:** Accepted
- **Date:** 2026-11-19

## Context

The code is made only of colours. Players with colour blindness mix up pairs such as red/green, blue/purple and purple/pink, and then cannot read their own guesses. Hue alone fails them because the colours they confuse often look about equally bright.

## Decision

A **Shapes** setting (off by default) moulds a shape into the head of every colour peg: on the board, in the revealed code and on the palette buttons. Pegs stay round; only the head carries the shape.

| Colour | Shape    |
| ------ | -------- |
| red    | triangle |
| orange | square   |
| yellow | star     |
| green  | plus     |
| cyan   | drop     |
| blue   | diamond  |
| purple | crescent |
| pink   | heart    |

- **The pairs people confuse most get the most different outlines:** red ▲ / green ✚, blue ◆ / purple ☾, purple ☾ / pink ♥.
- **Moulded, not printed (0001).** The shape is drawn as a recess: dark fill with a light lower lip. A real accessible board game would do the same, and it adds no motion.
- **The palette keeps its shortcut digit** in a corner badge when shapes are on.

## Alternatives considered

- **Non-round pegs** (the whole peg is a square or a star). Gives the clearest outline, but the holes on the board are round and the pegs would no longer fit them.
- **Circle, hexagon, octagon, ✖.** At peg size the first three blur into a circle (and a circle reads as an empty hole); ✖ is ✚ rotated.
- **A colour-blind palette.** Helps one kind of colour blindness at most and changes the look for everyone. Shape works for every kind, and in greyscale too.

## Consequences

- `SHAPE_PATHS` in `src/features/game/components/PegShape.tsx` is a `Record<Color, …>`, so a new colour does not typecheck without a shape.
- Test new shapes in a greyscale screenshot: if you can still play with all colour removed, shape alone does the job.
- Feedback pegs are unchanged; they are told apart by light vs dark, not by hue.
