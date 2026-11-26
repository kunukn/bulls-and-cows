# 0010 — High scores are optional, on by default

- **Status:** Accepted
- **Updated:** 2026-11-26

## Context

A win that makes the top 10 asks for a name and, once saved, opens the High scores page. Some players only want to play, and the prompt gets in their way after every good game.

## Decision

A High scores switch in Settings, on for new players, controls the name prompt. When it is off, a win is not recorded and nothing asks for a name. The trophy link, the High scores page and the scores already saved stay as they are. A daily code win never asks for a name, whatever the switch says; the daily game keeps its own stats (0012). Swap-mode wins go on their own lists (0013).

While the name field holds a name, Save score is the only prominent button: starting a new game is a plain text button that says the score won't be saved. With the field empty it is the usual green New game button, because nothing on screen looks about to be saved. Both are as tall as Save score, so typing a name never moves the panel.

## Alternatives considered

- **Collapse the form behind a Save score button.** Needs no setting, but adds a tap to every win for players who do want their scores.
- **Save automatically under the last name used.** Removes the typing, but does nothing for players who want no scores, and puts the wrong name on a shared device.
- **A "Don't ask again" button on the win panel.** Easier to find than a setting, but one stray tap silently stops scores being saved.
- **A green New game button beside a filled-in name.** Reads as "save and carry on": players typed a name, tapped it and lost the score.
- **The plain text button whenever the name prompt shows.** With an empty field Save score can't act yet, so the panel has no prominent button that works.
- **New game also saves the name in the field.** Matches that expectation, but saves a prefilled name nobody confirmed, and the only way to skip is to empty the field.
- **Confirm before starting a game with an unsaved score.** Nothing is lost by accident, but every player who skips on purpose pays an extra tap.
- **Also hide the trophy link when off.** Leaves the header nav with a single link and makes earlier scores unreachable.

## Consequences

- A win made while the switch is off is never recorded; turning it on later doesn't bring it back, unless that won game is still on screen.
- The clock keeps running either way, because the win line still shows the time.
- Picking another difficulty on a finished game, or New game on the High scores page, still drops an unsaved score without saying so.
- Guarded by `src/features/game/store/settings.test.ts`, and by the high scores switch test and the typed-name test in `e2e/game.spec.ts`.
