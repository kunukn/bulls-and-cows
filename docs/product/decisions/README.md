# Product Decision Records

Why the product rules are what they are, including the options that were tried and rejected, so a settled question isn't reopened without new information.

Records are append-only. To change a decision, add a new record and mark the old one `Superseded by NNNN`.

| #                                     | Decision                                                     | Status                     |
| ------------------------------------- | ------------------------------------------------------------ | -------------------------- |
| [0001](0001-physical-board-motion.md) | Motion follows a physical board                              | Accepted                   |
| [0002](0002-peg-sounds.md)            | Peg sounds are real plastic clicks, off by default           | Default superseded by 0006 |
| [0003](0003-game-sounds.md)           | Board sounds stay physical; only the game's end gets music   | Accepted                   |
| [0004](0004-offline-play.md)          | The game works offline and updates silently                  | Accepted                   |
| [0005](0005-colour-shapes.md)         | Colours can carry a shape too                                | Accepted                   |
| [0006](0006-sound-on-by-default.md)   | Sound effects are on by default                              | Accepted                   |
| [0007](0007-choose-peg-order.md)      | Players choose which hole a peg goes into                    | Accepted                   |
| [0008](0008-light-mode.md)            | Light mode for the interface, and always light when printing | Accepted                   |

## Template

```markdown
# NNNN — <decision in a few words>

- **Status:** Proposed | Accepted | Superseded by NNNN
- **Date:** YYYY-MM-DD

## Context

What problem or observation prompted this. Who is affected.

## Decision

The rule, in one or two sentences.

## Alternatives considered

What else was tried or proposed, and why it lost.

## Consequences

What this makes easier or harder; what guards it (tests, helpers).
```
