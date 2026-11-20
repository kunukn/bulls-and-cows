# 0016 — Six-colour modes use cyan and purple, not blue

- **Status:** Accepted
- **Date:** 2026-11-20

## Context

0015 put cyan and blue in the six-colour set (Easy, Classic) and left purple to Hard, because blue and purple are nearly identical under deuteranopia. In play, cyan and blue side by side look too alike to players with typical colour vision. Putting purple back instead of cyan brings back the blue/purple clash.

## Decision

Easy and Classic use **red, orange, yellow, green, cyan, purple**. Hard adds blue and pink. Every palette is sorted like a rainbow, so a colour's digit can differ between difficulties; its shape never does.

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

Worst pair per vision type (OKLab distance ×100, Machado 2009 at full severity, same method as 0015):

| Vision       | Cyan + purple (chosen) | Blue + purple    | Cyan + blue (0015) |
| ------------ | ---------------------- | ---------------- | ------------------ |
| Typical      | red/orange 16.1        | blue/purple 14.8 | red/orange 16.1    |
| Protanopia   | orange/green 9.7       | blue/purple 6.7  | orange/green 9.7   |
| Deuteranopia | orange/green 7.9       | blue/purple 1.9  | orange/green 7.9   |
| Tritanopia   | green/cyan 9.3         | green/blue 10.6  | green/cyan 9.3     |

Cyan + purple ties 0015's set for colour-blind players and avoids the cyan/blue pair that looked alike in play (cyan/purple is ≥ 24 under every vision type).

## Alternatives considered

- **Blue + purple.** Rejected: blue/purple is the worst pair in the palette (1.9 under deuteranopia).
- **Cyan + blue (0015).** Rejected: the two look alike side by side to players with typical vision.
- **Hard's extra colours at the end** so digits 1–6 match on every difficulty. Rejected: rainbow order on every level reads better than stable digits.

## Consequences

- `COLORS` in `src/features/game/logic.ts` is in tier order; `paletteFor()` sorts each palette by `RAINBOW_ORDER`.
- Purple is 6 on Easy/Classic and 7 on Hard.
- Blue/purple (Hard only) stays the hardest pair; the ◆/☾ outlines carry it.
- Easy and Classic games saved with blue start fresh, as the persistence check validates against the difficulty's palette.
