# Product Decision Records

Why the product rules are what they are, including the options that were tried and rejected, so a settled question isn't reopened without new information.

## Records describe the current rules

Each record states a rule as it holds today, as if it had always been decided that way. Git history keeps how it got there (`git log -p -- docs/product/decisions/`).

- **Changing a rule:** edit the record that owns it, update its alternatives (the old rule usually becomes one), and bump **Updated**. Don't add a record that overrides another.
- **New rule:** add it to the record whose topic it belongs to. Start a new record only for a new topic.
- **No history in the text:** no "Superseded", no "was off by default", no "0005 used to…". Keep a migration note only while the migration code exists.
- **Rejected options stay** under _Alternatives considered_, so they aren't proposed again.
- **Numbers are stable labels**, cited in code comments as `(0004)`. If a record is merged away, renumber to close the gap and update those citations (`grep -rn "00[0-9][0-9]" src e2e`).

| #                                         | Decision                                                                              |
| ----------------------------------------- | ------------------------------------------------------------------------------------- |
| [0001](0001-physical-board-motion.md)     | Motion follows a physical board                                                       |
| [0002](0002-sounds.md)                    | Board sounds are physical, only the game's end gets music, and sound is on by default |
| [0003](0003-offline-play.md)              | The game works offline and updates silently                                           |
| [0004](0004-peg-colours-and-shapes.md)    | Peg colours and shapes work for colour-blind players                                  |
| [0005](0005-choose-peg-order.md)          | Players choose which hole a peg goes into                                             |
| [0006](0006-light-mode.md)                | Light mode for the interface, and always light when printing                          |
| [0007](0007-board-themes.md)              | Six board themes, each clearly different                                              |
| [0008](0008-auto-check-off-by-default.md) | Auto check is off by default                                                          |
| [0009](0009-game-menu.md)                 | New game and Give up share one menu                                                   |
| [0010](0010-optional-high-scores.md)      | High scores are optional, on by default                                               |
| [0011](0011-bull-hints.md)                | The bull gives hints from the player's own clues                                      |
| [0012](0012-daily-code.md)                | One daily code, the same for everyone                                                 |

## Template

```markdown
# NNNN — <decision in a few words>

- **Status:** Proposed | Accepted
- **Updated:** YYYY-MM-DD

## Context

What problem or observation prompted this. Who is affected.

## Decision

The rule as it holds today, in one or two sentences.

## Alternatives considered

What else was tried or proposed, and why it lost.

## Consequences

What this makes easier or harder; what guards it (tests, helpers).
```
