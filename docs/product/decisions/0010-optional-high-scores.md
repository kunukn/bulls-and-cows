# 0010 — High scores are optional, on by default

- **Status:** Accepted
- **Updated:** 2026-11-23

## Context

A win that makes the top 10 asks for a name and, once saved, opens the High scores page. Some players only want to play, and the prompt gets in their way after every good game.

## Decision

A High scores switch in Settings, on for new players, controls the name prompt. When it is off, a win is not recorded and nothing asks for a name. The trophy link, the High scores page and the scores already saved stay as they are. A daily code win never asks for a name, whatever the switch says; the daily game keeps its own stats (0012).

## Alternatives considered

- **Collapse the form behind a Save score button.** Needs no setting, but adds a tap to every win for players who do want their scores.
- **Save automatically under the last name used.** Removes the typing, but does nothing for players who want no scores, and puts the wrong name on a shared device.
- **A "Don't ask again" button on the win panel.** Easier to find than a setting, but one stray tap silently stops scores being saved.
- **Also hide the trophy link when off.** Leaves the header nav with a single link and makes earlier scores unreachable.

## Consequences

- A win made while the switch is off is never recorded; turning it on later doesn't bring it back, unless that won game is still on screen.
- The clock keeps running either way, because the win line still shows the time.
- Guarded by `src/features/game/store/settings.test.ts` and the high scores switch test in `e2e/game.spec.ts`.
