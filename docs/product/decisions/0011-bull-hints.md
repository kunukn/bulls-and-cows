# 0011 — The bull gives hints from the player's own clues

- **Status:** Accepted
- **Updated:** 2026-11-22

## Context

The bull mark in the header was decoration. Players stuck mid-game had no help beyond the rules, and the brand bull (Tyr, the Danish word for bull) had no voice. Hard needs the most help: with five slots and eight colours, the useful facts are counts ("at least two red") and shortlists ("slot 3 is red or blue"), which are tedious to work out by hand.

## Decision

There are two bulls with separate jobs, so they never say the same thing. Each opens a speech bubble with a random line, and each further click says something new.

- **The header bull chats.** Jokes, and after a game a word on the win or loss. It never helps with the game.
- **The shield bull helps.** While playing, a bull is moulded into the end of the code shield. Before the first guess it gives general tips. After that it only says facts that follow from the player's own clues:
  - colours that are in or out, and how many pegs of a colour: exactly, at least, or no more than one;
  - whether a colour repeats;
  - slots: settled, a shortlist of two or three colours, or a colour ruled out, and where to look for a colour that's in;
  - how many codes still fit.
- **It checks the row being built.** A peg whose colour is out or can't sit in that slot, pegs that don't fit the clues together, a full row that breaks a clue (and which row), or a row that still fits. These come first and then alternate with board facts, because they are what the player can act on right now.
- When the clues settle nothing yet, the shield bull says so.
- Hints never name the whole code, even when only one code fits.
- Hints are free: they don't change the score, the clock or high scores.
- No hint kind crowds out the others. A random pick chooses the kind first, then a fact of that kind.
- **Help never asks to be used.** The player should try to solve the game first. The shield bull is smaller and dimmer than the header bull, and nothing about it glows, pulses or uses an alert colour.
- **A quiet marker shows when there's something new.** A small dimmed-yellow dot appears when a guess proves a fact the player hasn't been shown: a colour in or out, a proven count or repeat, a settled or shortlisted slot, or one code left. Asking the shield bull clears it. Single slot exclusions, "no more than one" and the code count don't show it, because nearly every guess changes them.
- **Hints can be switched off** in Settings (on by default). When they're off, there's no shield bull.

## Alternatives considered

- **Colour-only hints.** Gentler, but slot facts are what players actually get stuck on.
- **Revealing the code when one fits.** Ends the puzzle for the player. "Only one code fits" keeps the last step theirs.
- **Marking hinted scores, or hints that cost a guess.** Fairer for high scores, but it needs a store migration or a rules change, and it turns a friendly mascot into a penalty.
- **Clicking again closes the bubble.** Standard popover behaviour, but it makes asking for another hint cost two clicks.
- **A lightbulb icon on the shield while any hint exists.** Familiar, but it looks like a web widget on a physical board (0001). It would also stay lit from the second guess to the end of the game, so it would stop meaning anything.
- **A marker in the bull's own colour, or in grey.** The bull's colour isn't distinct from the bull, and on Felt it is yellow. A light grey vanishes on the Candy and Paper shields, a dark grey on the three dark ones.
- **A pale-blue marker.** Distinct from the bull on all six shields; tried, and the dimmed yellow was preferred.
- **An ivory marker.** Distinct on dark shields, but it is the cow peg's colour and sits beside the feedback column.
- **A glowing yellow light for new hints.** Easy to notice, but it reads as a notification and pulls the player into clicking before they've thought for themselves.
- **Only a dot on the header bull.** No new board element, but the header is out of view while playing.
- **One bull doing both jobs.** The header bull first gave hints mid-game too, so the two bulls repeated each other and the header's jokes disappeared exactly when a game was on.
- **Suggesting the next guess.** The strongest help the solver could give, but then the bull plays the game. Checking the player's own row keeps the thinking theirs.

## Consequences

- Deductions list every code that fits the clues (`src/features/game/hints.ts`). The worst case is Hard: 8⁵ codes, about 20 ms, run on a click and once per scored guess for the marker.
- The shield itself is `aria-hidden` and ignores clicks, so `Board.tsx` lays a see-through Hint button over the moulded bull. The bull lifts away with the shield when the game ends.
- What the player has seen lives in a non-persisted store keyed by the game (`src/features/game/store/hintsSeen.ts`), so a reload shows the marker again if there's anything to tell.
- Facts are exact for the codes that are left, so a hint is never wrong. A property test checks every hint against the real secret over seeded games on each difficulty (`hints.test.ts`).
- "Your row fits your clues" makes the bull a checker: a patient player can test pegs one at a time. That's accepted, because it only confirms what the clues already prove.
- Line choice and its fairness rules live in `src/features/game/bullLines.ts`: `pickChatLine` for the header bull, `pickHintLine` for the shield bull. The bubble is `src/components/layout/BullBubble.tsx`, and `e2e/game.spec.ts` covers the click flow.
