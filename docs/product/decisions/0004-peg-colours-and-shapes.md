# 0004 — Peg colours and shapes work for colour-blind players

- **Status:** Accepted
- **Updated:** 2026-11-20

## Context

The code is made only of colours. Players with colour blindness mix up pairs such as red/green, blue/purple and purple/pink, and then cannot read their own guesses. Hue alone fails them because the colours they confuse often look about equally bright. Some players also want to play with shape alone: as a harder challenge, or because hue gives them no help at all.

## Decision

Rules, in priority order:

1. **A colour always has the same shape**, on every difficulty.
2. **The six-colour set (Easy, Classic) is one colour-blind players tell apart well, with no pair that looks alike to players with typical vision.**
3. **Every palette is sorted like a rainbow**, so a colour's digit can differ between difficulties.

| Colour | Shape    | Easy / Classic | Hard |
| ------ | -------- | -------------- | ---- |
| red    | triangle | 1              | 1    |
| orange | square   | 2              | 2    |
| yellow | star     | 3              | 3    |
| green  | plus     | 4              | 4    |
| cyan   | heart    | 5              | 5    |
| blue   | diamond  | —              | 6    |
| purple | crescent | 6              | 7    |
| pink   | drop     | —              | 8    |

Worst pair per vision type for the candidate six-colour sets (OKLab distance ×100, Machado 2009 at full severity; higher is easier to tell apart):

| Vision       | Cyan + purple (chosen) | Blue + purple    | Cyan + blue      |
| ------------ | ---------------------- | ---------------- | ---------------- |
| Typical      | red/orange 16.1        | blue/purple 14.8 | red/orange 16.1  |
| Protanopia   | orange/green 9.7       | blue/purple 6.7  | orange/green 9.7 |
| Deuteranopia | orange/green 7.9       | blue/purple 1.9  | orange/green 7.9 |
| Tritanopia   | green/cyan 9.3         | green/blue 10.6  | green/cyan 9.3   |

Orange/green is the worst pair in every top set: dropping green or orange forces pink and cyan in together (6.2). Cyan/purple is ≥ 24 under every vision type.

**Pegs** in Settings has three options: **Colour** (default), **Both** (colour + shape) and **Shape**. In Shape, every colour peg is the same ivory plastic with a thin dark ring, and only the moulded shape tells the pegs apart, on the board, in the revealed code and on the palette buttons.

- **The pairs people confuse most get the most different outlines:** red ▲ / green ✚, cyan ♥ / blue ◆, blue ◆ / purple ☾, purple ☾ / pink 💧, orange ■ / pink 💧 (the closest pair under tritanopia).
- **Pegs stay round; only the head carries the shape.** The shape is moulded, not printed (0001): a recess drawn as a dark fill with a light lower lip. It adds no motion.
- **The palette keeps its shortcut digit** in a corner badge when shapes show.

## Alternatives considered

- **Blue + purple in the six-colour set.** Blue/purple is the worst pair in the palette (1.9 under deuteranopia).
- **Cyan + blue in the six-colour set.** Ties cyan + purple for colour-blind players, but the two look alike side by side to players with typical vision.
- **Hard's extra colours at the end** so digits 1–6 match on every difficulty. Rainbow order on every level reads better than stable digits.
- **Reassign every shape** to maximise silhouette difference on confusable pairs. Pixel overlap found a slightly better mapping, but it moves almost every shape, and overlap underrates the difference between angular and curved outlines (◆ vs ☾).
- **Non-round pegs** (the whole peg is a square or a star). Gives the clearest outline, but the holes on the board are round and the pegs would no longer fit them.
- **Circle, hexagon, octagon, ✖.** At peg size the first three blur into a circle (and a circle reads as an empty hole); ✖ is ✚ rotated.
- **A colour-blind palette instead of shapes.** Helps one kind of colour blindness at most and changes the look for everyone. Shape works for every kind, and in greyscale too.
- **Two switches (Shapes, Colours).** Allow colour and shape both off, which leaves the pegs carrying no information. One three-way choice can't reach that state. It is a segmented native radio group, like Appearance (0006).
- **Greyscale versions of the colours for Shape.** The colours differ in brightness (yellow is much lighter than blue), so greyscale still gives the colour away.
- **Hollow pegs (outline only).** An outlined circle reads as an empty hole.
- **A dark neutral peg for Shape.** Blends into the dark boards; ivory stands out on every board, and the ring keeps it visible on Paper and in light mode.

## Consequences

- `COLORS` in `src/features/game/logic.ts` is in tier order (a difficulty with N colours uses the first N); `paletteFor()` sorts each palette by `RAINBOW_ORDER`.
- Saved games are checked against their difficulty's palette, so a game holding a colour its palette doesn't offer starts fresh instead of becoming unwinnable.
- Blue/purple (Hard only) is the hardest pair; the ◆/☾ outlines carry it.
- `SHAPE_PATHS` in `src/features/game/components/PegShape.tsx` is a `Record<Color, …>`, so a new colour does not typecheck without a shape.
- `getPegClass()` in `src/features/game/components/Peg.tsx` is the one place that picks a peg's fill; use it for any new place that draws a colour peg.
- Test new shapes in a greyscale screenshot: if you can still play with all colour removed, shape alone does the job.
- Feedback pegs have no shapes; they are told apart by light vs dark, not by hue.
- Screen-reader labels use colour names ("Add red") in every peg style: colour stays the peg's identity in the game, and no shape names need translating.
- High scores don't record the peg style; it is a display choice.
