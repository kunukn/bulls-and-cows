# 0002 — Board sounds are physical, only the game's end gets music, and sound is on by default

- **Status:** Accepted
- **Updated:** 2026-11-20

## Context

Motion (0001) gives the board feel; sound can add to it. Winning is the moment that most deserves a reward, and a plastic board has no sound that feels like one. Many players play in quiet places, but a setting that starts off is one most players never find.

## Decision

Every board action sounds like the board; only winning and losing get music. One **Sound** setting covers all of it and is on for new players.

- **Recorded, not synthesised.** Sounds follow 0001's question: could a plastic peg make this? Clips come from Kenney's CC0 Impact Sounds (`public/sounds/LICENSE.md`).
- **Placing a peg** plays a short impact click, chosen per peg from five clips with a small pitch and volume change. Only pegs that land make a sound: the machine emits `pegPlaced` when a peg fills a slot, so a full row, undo and clear stay silent.
- **Varied, not random.** `pickPegSound` hashes row, slot and colour the same way `pickInsertAnimation` does, so a peg always sounds the same and neighbouring pegs differ.
- **Other board sounds are impacts too:** key pegs tick as they pop in (bulls higher than cows, so the score can be heard), a rejected check thuds with the row shake, a removed peg is its own click played lower and quieter, and the shield clacks as it stands upright.
- **Game end is a short jingle**, a deliberate exception to 0001: a rising pizzicato phrase (D–E–F♯–G) for a win, the same notes falling for a loss. Gentle, since children play too. Giving up counts as a loss.
- **Sounds follow the animations they belong to:** ticks are scheduled on the `feedback-pop` peaks, and the shield clack on the shield's 500 ms lift (at once under reduced motion).
- Background music, if added, gets its own toggle.

## Alternatives considered

- **Synthesised clicks** (ffmpeg or Web Audio oscillators). No assets, unlimited variation, but they sound like UI bleeps rather than plastic.
- **`Math.random()` per play.** Feels livelier but makes the same peg sound different each time, and breaks the pairing with the animation picker.
- **Shield clack and a peg rattle only, no jingle.** True to 0001, but a win sounds no different from a loss.
- **8-bit or sax jingles** from the same pack. 8-bit says video game, not board game; sax is too big for a half-second reward.
- **Sounds for every button** (settings, navigation). Heard on every tap; noise rather than feel.
- **Off by default.** Safe in quiet places, but hides a big part of the game's feel from most players.
- **Ask on first load.** One more dialog before the first game, for a choice the Settings drawer already offers.

## Consequences

- Nothing plays before the first tap: browsers keep audio suspended until a user gesture, and `playClip` resumes it then. So the first sound a player hears is the peg they placed.
- Clips are trimmed WAV (no codec padding, so the click doesn't lag behind the animation). Playback uses Web Audio; on iOS it follows the ringer switch.
- The machine emits `pegPlaced`, `pegRemoved`, `rowIncomplete`, `scored` and `gameOver`; `useGameSounds` is the only listener that plays audio.
- A restored game (page reload in a won/lost state) doesn't replay the jingle: entry actions don't run on a restored snapshot.
- Changing `feedback-pop` timing or the shield's duration means updating the constants in `FeedbackPegs.tsx` / `useGameSounds.ts`.
- Players who saved a choice keep it, because the whole settings object is saved.
