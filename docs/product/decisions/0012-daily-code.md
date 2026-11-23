# 0012 — One daily code, the same for everyone

- **Status:** Accepted
- **Updated:** 2026-11-23

## Context

A practice game deals a random code nobody else gets, so a result can't be compared with a friend's and gives no reason to come back tomorrow. The app is a static site with no server, so anything players share has to be worked out in each browser.

## Decision

The Daily code page (`/daily`) offers one code per calendar day, the same for every player, beside the practice game.

- **The date picks the code.** The day's number (#1 is 23 November 2026) seeds a small generator, so every device deals the same code without a server.
- **The day changes at the player's local midnight.**
- **Classic rules:** 4 pegs, 6 colours, repeats, 10 guesses.
- **One attempt.** There is no New game, and Reveal code counts as a loss. The finished board stays until the next day.
- **Its own save.** A daily game never replaces a practice game in progress, and a practice game never replaces the daily one.
- **Stats, not high scores.** Played, win rate, streak, best streak and wins by number of guesses, kept in the browser. A daily win doesn't ask for a name (0010).
- **A streak is days won in a row.** An unplayed today doesn't end it; a missed day or a loss does.
- **A finished day can be shared.** Share sends the day's number, the score (`4/10`, or `X/10` for a loss) and one line per guess of black (bull), white (cow) and empty (miss) circles, then a link to the daily page. It never includes the colours. Bulls come first, then cows, because the feedback pegs say how many, not which slot. It opens the device's share sheet, or copies the text where there is none.
- **Hints work as in practice** (0011).
- **The way in is a row above the difficulty picker** on the play page. It shows whether today's code is solved.
- **It is played on www.tyrko.app only.** The GitHub Pages mirror shows the same row, but it links to the main site, and the mirror's own daily URL goes there too. Each site keeps its own save, so a second site would be a second attempt and a second streak.
- **A new day never interrupts a game.** A finished or untouched board moves on to today's code when the app comes back into view, or from the Play today's code button. A game under way stays until it's finished or the page is reloaded.

## Alternatives considered

- **The UTC day.** Everyone switches at the same moment, but for most players the code would change in the middle of the day.
- **A daily code per difficulty.** More to play, but three results to compare instead of one.
- **Daily as a fourth choice in the difficulty picker.** No extra row, but four segments don't fit the German and French labels at 320px.
- **A header icon.** The header has room for four icons at 320px, and it has four.
- **One save shared with practice.** Less code, but starting either game would throw away the other, and the finished daily board is what keeps the day to one attempt.
- **Daily wins on the high score lists.** One list fewer to explain, but the name prompt would sit on top of the stats, which are the daily game's own score.
- **The daily code on the mirror as well.** Nothing to build, but a player could solve the day on one site and replay it on the other, and stats would split between the two.
- **A code the player can't work out.** Needs a server. The code follows from the date and the source, and changing the device clock or clearing site data allows another go. That is fine for a friendly game.
- **Coloured squares in the shared result.** Familiar from word games, but they read as one square per slot, which the feedback pegs don't mean.
- **Bull and cow emoji in the shared result.** On theme, but wider than the circles, and harder to read at a glance.
- **A separate copy of the generator for daily codes.** Protects them from a change to practice games, but duplicates `generateSecret`. A test that pins a few days' codes guards the same thing.

## Consequences

- Changing the first day, the generator, `generateSecret` or Classic's palette changes codes players are comparing. `src/features/daily/daily.test.ts` pins four days and fails when that happens.
- Stats live in one browser: clearing site data clears them, and they don't follow the player to another device.
- A day that was started but never finished counts as missed.
- A new mirror has to set `VITE_DAILY_URL` in its build, as `deploy.yml` does; without it the mirror hosts its own daily game.
- Guarded by the tests in `src/features/daily/`, the daily cases in `src/features/game/machine.test.ts`, and `e2e/daily.spec.ts`.
