# 0013 — The computer may swap the code, but the pins never lie

- **Status:** Accepted
- **Updated:** 2026-11-25

## Context

Once a player knows the game, a lucky early guess can win it, and the computer never pushes back. Some players want a codemaker that fights back while still playing fair.

## Decision

An "AI can swap colours" switch in Settings, off for new players, turns on swap mode for practice games.

- **The code can change after each guess.** Before pinning a guess, the computer may switch to any code that fits every pin shown so far. Of those codes, it keeps the group that would earn the same pins and holds the most codes. Its answer tells the player as little as it can.
- **The pins never lie.** Every code it can switch to matches every row already on the board, so the code shown at the end fits the whole board.
- **Ties are broken in a fixed order.** The computer avoids the winning group first, then keeps its current code where it can, then shows fewer pins. A win comes only when the guess is the last code still possible.
- **It is always winnable.** With perfect play the worst case is 5 guesses in Classic (Knuth, 1977). Easy has only 360 codes, and known strategies solve Hard in about 7, all within the 10 and 12 guesses allowed. It is still much harder for a person than a fixed code.
- **It starts with the next game.** Turning the switch on or off never changes a game in progress. A saved game keeps its mode through a reload.
- **A Swap badge marks a swap-mode game.** It sits beside the game menu and timer, and follows the game, not the switch, so it says what the board in front of you is doing. Minimal text keeps only its icon.
- **Never on the daily code.** Everyone shares one fixed daily code (0012), so it never swaps.
- **Its own high scores.** Swap-mode wins go on separate lists (0010). The High scores page shows a Normal / Swap choice once the switch is on, or once a swap-mode score exists.
- **Hints work unchanged** (0011). They already read only the player's own clues, so "codes left" counts exactly the codes the computer can still switch to.

## Alternatives considered

- **Only reorder the secret's colours.** It is easier to explain, but every pin stays a pin: the computer can only turn black into white. That twist is too mild to notice.
- **Pick a random group instead of the largest.** It feels less "evil", but it can hand over an early win, and the switch would no longer mean anything.
- **Shared high-score lists.** Simpler, but swap-mode scores aren't comparable with normal ones.

## Consequences

- No list of possible codes is saved. It is rebuilt from the board on each guess: up to 32,768 codes in Hard, a few milliseconds.
- The stored secret is updated to the computer's current choice after each guess. The code reveal at the end, Give up and saved games work as in a normal game.
- Guarded by the `dodgeSecret` tests in `src/features/game/logic.test.ts`, the swap-mode block in `machine.test.ts`, and `persistence.test.ts`, `highscores/store.test.ts` and `settings.test.ts`.
