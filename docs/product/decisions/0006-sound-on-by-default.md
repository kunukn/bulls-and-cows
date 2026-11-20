# 0006 — Sound effects are on by default

- **Status:** Accepted
- **Date:** 2026-11-19

## Context

0002 made sound off by default, so a first-time player never hears the plastic clicks, the feedback ticks or the shield, and most never find the setting. The sounds are short, quiet board noises (0002, 0003), not music on load.

## Decision

The Sound setting is on for new players. It replaces only 0002's default; everything else in 0002 still holds.

## Alternatives considered

- **Keep it off (0002).** Safe in quiet places, but hides a big part of the game's feel from most players.
- **Ask on first load.** One more dialog before the first game, for a choice the Settings drawer already offers.

## Consequences

- Nothing plays before the first tap: browsers keep audio suspended until a user gesture, and `playClip` resumes it then. So the first sound a player hears is the peg they placed.
- Players who have opened the game before keep their saved choice (off, unless they turned it on), because the whole settings object is saved.
- Players turn it off in Settings; on iOS the ringer switch also mutes it.
