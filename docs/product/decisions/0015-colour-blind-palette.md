# 0015 — The six-colour palette is picked for colour blindness

- **Status:** Accepted; colour set superseded by 0016
- **Date:** 2026-11-20

## Context

Easy and Classic use six of the eight colours. They used red, orange, yellow, green, blue and purple. Simulating colour blindness (Machado 2009, full severity, distances in OKLab ×100) shows blue and purple are almost the same colour under deuteranopia (ΔE 1.9) and close under protanopia (6.7). That made the old set the 14th best of the 28 possible six-colour sets.

## Decision

Rules, in priority order:

1. **A colour always has the same shape**, on every difficulty.
2. **The colours are the ones colour-blind players tell apart best.** The six-colour set maximises the worst pair's distance under protanopia, deuteranopia and tritanopia.
3. **Palette numbers may differ between difficulties.** Each palette is sorted like a rainbow; a colour's digit can change if that helps rule 2.

The best set is **red, orange, yellow, green, cyan, blue**. Its worst pair is green/orange (ΔE 7.9 deuteranopia), which every top set shares: dropping green or orange forces pink and cyan in together (6.2). Swapping blue for purple ties on that measure, but blue is kept because the blue/purple pair (1.9) then only appears on Hard. Swapping cyan for pink also ties, but cyan is better under tritanopia (9.3 vs 8.0).

Hard adds purple and pink. As both end the rainbow, slots 1–6 happen to match on every difficulty.

| Colour | Shape    | Difficulties |
| ------ | -------- | ------------ |
| red    | triangle | all          |
| orange | square   | all          |
| yellow | star     | all          |
| green  | plus     | all          |
| cyan   | heart    | all          |
| blue   | diamond  | all          |
| purple | crescent | Hard         |
| pink   | drop     | Hard         |

Cyan and pink swap shapes compared with 0005: orange/pink is the closest pair under tritanopia (8.0), and a square differs more from a drop than from a heart.

## Alternatives considered

- **Keep purple in the six-colour set.** Rejected: blue/purple is the worst pair in the whole palette.
- **Reassign every shape** to maximise silhouette difference on confusable pairs. Pixel overlap found a slightly better mapping, but it moves almost every shape, and overlap underrates the difference between angular and curved outlines (◆ vs ☾). Not worth relearning.
- **Out-of-rainbow order on Hard** to keep digits stable. Unnecessary: the chosen sets keep them stable anyway.

## Consequences

- `COLORS` in `src/features/game/logic.ts` is in rainbow order and `paletteFor()` slices it. If a later change breaks the prefix, sort each palette by hue instead (rule 3) rather than picking a worse set.
- Saved games are checked against their difficulty's palette, so an Easy or Classic game saved with purple starts fresh instead of becoming unwinnable.
- Blue/purple (Hard only) stays the hardest pair; the ◆/☾ outlines carry it.
