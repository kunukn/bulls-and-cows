# 0012 — One daily code, the same for everyone

- **Status:** Accepted
- **Updated:** 2026-11-24

## Context

A practice game deals a random code nobody else gets, so a result can't be compared with a friend's and gives no reason to come back tomorrow. The app is a static site with no server, so anything players share has to be worked out in each browser.

## Decision

The Daily code page (`/daily`) offers one code per calendar day, the same for every player, beside the practice game.

- **The date picks the code.** The day's number (#1 is 23 November 2026) seeds a small generator, so every device deals the same code without a server.
- **The day changes at the player's local midnight.**
- **Classic rules:** 4 pegs, 6 colours, repeats, 10 guesses.
- **One attempt.** There is no New game, and Reveal code counts as a loss. The finished board stays until the player starts the next day's code.
- **Its own save.** A daily game never replaces a practice game in progress, and a practice game never replaces the daily one.
- **Stats, not high scores.** Played, win rate, streak, best streak and wins by number of guesses, kept in the browser. A daily win doesn't ask for a name (0010).
- **A streak is days won in a row.** An unplayed today doesn't end it; a missed day or a loss does.
- **A finished day can be shared.** Share sends the day's number, the score (`4/10`, or `X/10` for a loss) and one line per guess of black (bull), white (cow) and empty (miss) circles, then a link to the daily page. It never includes the colours. Bulls come first, then cows, because the feedback pegs say how many, not which slot. It opens the device's share sheet, or copies the text where there is none.
- **One tap to X, Threads and Bluesky.** These are where players share most, so each gets its own button in a row under the chart, showing the site's logo and name. The button opens the site's post box with the same text filled in, in a new tab or the site's app. Threads' post link turns every emoji into "�", so its text uses ● bull, ◎ cow and ○ miss instead: text shapes that come through and stay one width, so the rows still line up. Nothing is posted until the player confirms there. Share stays beside Practice game for everywhere else.
- **No hints on the daily code.** Everyone solves the same code, so the shield bull (0011) doesn't read the clues or give tips there, and shows no new-hint dot. It talks about the day instead: calm, breathing-style lines; how the daily code works (one try saved in this browser, the same code for everyone from the date, a new code at local midnight with the time left, Classic rules, Reveal code as a loss, streaks); facts about Classic (1,296 codes, Knuth's five-guess proof, about 4.3 guesses on average with perfect play); and, once the player has finished a daily code, their own wins, average guesses per win and best streak. Its button says "Ask Tyr about today's code", not "Hint". Each group gets an equal chance, as in 0011.
- **The way in is a row above the difficulty picker** on the play page. It shows whether today's code is solved.
- **The daily header shows what makes the day different.** It takes the difficulty picker's place and height, and shows the date, the rules, "1 try", the current streak (when there is one) and a link back to practice.
- **It can be switched off.** A Daily code switch in Settings, on for new players, hides the row and the daily section of How it works. The `/daily` page, a game on it and the stats stay, so a link a friend shares still opens.
- **It is played on every site.** The GitHub Pages mirror and the itch.io embed host the daily code too, so nobody is sent away from the site they chose. Each site keeps its own save, so a second site is a second attempt and a second streak; that is accepted, since results are shared, not ranked. A shared result always links to www.tyrko.app/daily, wherever it was played.
- **A new day never interrupts a game, or a result still to share.** An untouched board moves on to today's code when the app comes back into view. A finished board stays, through a reload or a reboot too, so the result can still be shared the next day. Play today's code moves on. Only yesterday's board is kept: an older finished board, or an unfinished one from an earlier day, gives way to today's code when the page loads. A game under way stays until it's finished or the page is reloaded.

## Alternatives considered

- **The UTC day.** Everyone switches at the same moment, but for most players the code would change in the middle of the day.
- **A daily code per difficulty.** More to play, but three results to compare instead of one.
- **Daily as a fourth choice in the difficulty picker.** No extra row, but four segments don't fit the German and French labels at 320px.
- **An accent colour for the daily code.** Sets it apart at a glance, but a warm accent read as an orange theme against the app's slate look.
- **Tint the board for the daily game.** Most visible, but it would override the board theme the player picked (0007).
- **A header icon.** The header has room for four icons at 320px, and it has four.
- **One save shared with practice.** Less code, but starting either game would throw away the other, and the finished daily board is what keeps the day to one attempt.
- **Daily wins on the high score lists.** One list fewer to explain, but the name prompt would sit on top of the stats, which are the daily game's own score.
- **The daily code on www.tyrko.app only.** Mirrors linking there keeps one attempt and one streak per player, but it sends players away from the site they chose. Inside the itch.io embed the link would load the main site in the game frame, where browsers keep its storage apart from a visit to www.tyrko.app, so it wouldn't prevent a second attempt anyway.
- **A shared link to the site it was played on.** Needs no constant, but a mirror's link advertises the copy, and an embed's own address isn't a page anyone can open.
- **A code the player can't work out.** Needs a server. The code follows from the date and the source, and changing the device clock or clearing site data allows another go. That is fine for a friendly game.
- **Coloured squares in the shared result.** Familiar from word games, but they read as one square per slot, which the feedback pegs don't mean.
- **Bull and cow emoji in the shared result.** On theme, but wider than the circles, and harder to read at a glance.
- **Hints as in practice.** One shared code with deductions on tap would turn comparing results into comparing who asked the bull. Calm words and how the day works keep the bull's voice without solving anything.
- **The number of hints in the shared result.** Fairer to players who solved alone, but it puts a public mark on asking for help, which 0011 keeps free. A count is also a poor measure: one click can be a general tip or "only one code fits".
- **Only the share sheet, as Wordle does.** One button, but on a desktop the sheet rarely lists X, Threads or Bluesky, so the player has to copy, open the site and paste.
- **The three sites behind a Share menu.** Tidier, but two taps, and the sites players want most are hidden until they open it.
- **Logo-only buttons in the bottom row.** Compact, but the targets are small and the row is easy to miss.
- **Move a finished board on when the app comes back into view.** Lands the player straight on the new code, but a player who reopens the app the next morning to share finds the result gone.
- **Keep the last finished board, however old.** Shareable for longer, but a player back after a week lands on an old result instead of today's code.
- **The time in the shared result.** The daily code scores guesses, not time. A shared time would also reward Auto check (0008), count interruptions, and turn a casual game into a race.
- **Also block `/daily` when switched off.** Tidier, but a shared link would land on nothing, and a game under way would be stranded.
- **A separate copy of the generator for daily codes.** Protects them from a change to practice games, but duplicates `generateSecret`. A test that pins a few days' codes guards the same thing.

## Consequences

- Changing the first day, the generator, `generateSecret` or Classic's palette changes codes players are comparing. `src/features/daily/daily.test.ts` pins four days and fails when that happens.
- The post links are each site's documented compose URL (`composeUrl` in `src/features/daily/share.ts`). If a site moves its URL, only that table changes. Logos come from Simple Icons (CC0) and are drawn in the text colour.
- Stats live in one browser: clearing site data clears them, and they don't follow the player to another device.
- A day that was started but never finished counts as missed.
- The shared link is `SHARE_DAILY_URL` in `src/features/daily/daily.ts`. If the main site moves, change it there.
- Daily bull lines are picked by `pickDailyLine` in `src/features/game/bullLines.ts`. The averages in its facts are published results for Classic (Knuth 1977; Koyama and Lai 1993), not measured in the app.
- Guarded by the tests in `src/features/daily/`, `pickDailyLine` in `src/features/game/bullLines.test.ts`, the daily cases in `src/features/game/machine.test.ts`, the daily default in `src/features/game/store/settings.test.ts`, and `e2e/daily.spec.ts`.
