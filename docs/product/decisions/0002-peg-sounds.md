# 0002 — Peg sounds are real plastic clicks, off by default

- **Status:** Accepted
- **Date:** 2026-11-19

## Context

Placing a peg had motion (0001) but no sound. Sound adds feel, but many players play in quiet places, and an unexpected noise is worse than none.

## Decision

Placing a peg plays a short recorded impact click, chosen per peg from five clips with a small pitch and volume change. The Sound setting is off until the player turns it on.

- **Recorded, not synthesised.** Sounds follow 0001's question: could a plastic peg make this? Clips come from Kenney's CC0 Impact Sounds (`public/sounds/LICENSE.md`).
- **Varied, not random.** `pickPegSound` hashes row, slot and colour the same way `pickInsertAnimation` does, so a peg always sounds the same and neighbouring pegs differ.
- **Only pegs that land make a sound.** The machine emits `pegPlaced` when a peg fills a slot, so a full row, undo and clear stay silent.

## Alternatives considered

- **Synthesised clicks** (ffmpeg or Web Audio oscillators). No assets, unlimited variation, but they sound like UI bleeps rather than plastic.
- **`Math.random()` per play.** Feels livelier but makes the same peg sound different each time, and breaks the pairing with the animation picker.
- **On by default.** Surprises players on first load; browsers also block audio before a user gesture.

## Consequences

- Clips are trimmed WAV (no codec padding, so the click doesn't lag behind the animation), loaded only once sound is turned on.
- Playback uses Web Audio; on iOS it follows the ringer switch.
- New sounds (removal, feedback pegs, win) should answer 0001's question and respect the same setting.
