# 0003 — Board sounds stay physical; only the game's end gets music

- **Status:** Accepted
- **Date:** 2026-11-19

## Context

0002 added peg clicks. Checking a guess, a rejected check, removing a peg and the end of a game were still silent. Winning is the moment that most deserves a reward, and a plastic board has no sound that feels like one.

## Decision

Every board action sounds like the board; only winning and losing get music.

- **Board sounds are impacts** (Kenney Impact Sounds): key pegs tick as they pop in (bulls higher than cows, so the score can be heard), a rejected check thuds with the row shake, a removed peg is its own click played lower and quieter, and the shield clacks as it stands upright.
- **Game end is a short jingle**, a deliberate exception to 0001: a rising pizzicato phrase (D–E–F♯–G) for a win, the same notes falling for a loss. Gentle, since children play too. Giving up counts as a loss.
- **One setting, "Sound effects"**, covers all of these. Background music, if added, gets its own toggle.
- **Sounds follow the animations they belong to**: ticks are scheduled on the `feedback-pop` peaks, and the shield clack on the shield's 500 ms lift (at once under reduced motion).

## Alternatives considered

- **Shield clack and a peg rattle only, no jingle.** True to 0001, but a win sounded no different from a loss.
- **8-bit or sax jingles** from the same pack. 8-bit says video game, not board game; sax is too big for a half-second reward.
- **Sounds for every button** (settings, navigation). Heard on every tap; noise rather than feel.

## Consequences

- The machine emits `pegRemoved`, `scored` and `gameOver` alongside `pegPlaced` and `rowIncomplete`; `useGameSounds` is the only listener that plays audio.
- A restored game (page reload in a won/lost state) doesn't replay the jingle: entry actions don't run on a restored snapshot.
- Changing `feedback-pop` timing or the shield's duration means updating the constants in `FeedbackPegs.tsx` / `useGameSounds.ts`.
