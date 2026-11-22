# 0011 — The bull gives hints from the player's own clues

- **Status:** Accepted
- **Updated:** 2026-11-22

## Context

The bull mark in the header was decoration. Players stuck mid-game had no help beyond the rules, and the brand bull (Tyr, the Danish word for bull) had no voice.

## Decision

Clicking the bull opens a speech bubble with a random line, and each further click says something new. While a game is in progress and at least one guess has been scored, the lines are facts that follow from the player's own clues: a colour that's out, colours that are in, a slot that is settled or ruled out, no repeats, and how many codes still fit. When the clues settle nothing yet, the bull says so. Before the first guess it gives general tips. After a game, and on other pages, it chats.

- Hints never name the whole code, even when only one code fits.
- Hints are free: they don't change the score, the clock or high scores.
- No hint kind crowds out the others. A random pick chooses the kind first, then a fact of that kind.

## Alternatives considered

- **Colour-only hints.** Gentler, but slot facts are what players actually get stuck on.
- **Revealing the code when one fits.** Ends the puzzle for the player. "Only one code fits" keeps the last step theirs.
- **Marking hinted scores, or hints that cost a guess.** Fairer for high scores, but it needs a store migration or a rules change, and it turns a friendly mascot into a penalty.
- **Clicking again closes the bubble.** Standard popover behaviour, but it makes asking for another hint cost two clicks.

## Consequences

- Deductions list every code that fits the clues (`src/features/game/hints.ts`). The worst case is Hard: 8⁵ codes, about 20 ms, and only on a click.
- Facts are exact for the codes that are left, so a hint is never wrong. A property test checks every hint against the real secret (`hints.test.ts`).
- Line choice and its fairness rules live in `src/features/game/bullLines.ts`. The bubble is `src/components/layout/BullBubble.tsx`, and `e2e/game.spec.ts` covers the click flow.
