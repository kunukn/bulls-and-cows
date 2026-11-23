---
name: browse-app
version: 1.1.0
description: Browse and interact with the running Tyr & Ko game using any available browser MCP tools (Playwright MCP, Chrome DevTools MCP, or similar). Use when the user wants to open the app, inspect a page, play or test a game flow, check the high-score page, or visually debug the UI.
allowed-tools:
  - Read
  - Bash
  - Grep
  - Glob
  - mcp__playwright__browser_navigate
  - mcp__playwright__browser_snapshot
  - mcp__playwright__browser_take_screenshot
  - mcp__playwright__browser_click
  - mcp__playwright__browser_type
  - mcp__playwright__browser_press_key
  - mcp__playwright__browser_resize
  - mcp__playwright__browser_handle_dialog
  - mcp__playwright__browser_evaluate
  - mcp__chrome-devtools__navigate_page
  - mcp__chrome-devtools__take_snapshot
  - mcp__chrome-devtools__take_screenshot
  - mcp__chrome-devtools__click
  - mcp__chrome-devtools__fill
  - mcp__chrome-devtools__press_key
  - mcp__chrome-devtools__resize_page
  - mcp__chrome-devtools__handle_dialog
  - mcp__chrome-devtools__evaluate_script
---

# Browse App

Browse and interact with the running Tyr & Ko game (a Mastermind-style
code-breaker) using whichever browser MCP tools are connected in the current
session (e.g. Playwright MCP, Chrome DevTools MCP).

## When to Use

- Open the app, or a specific page, and describe it
- Play or test a game flow (guess, win, lose, switch difficulty)
- Open or play the daily code
- Check the high-score page or persisted data
- Debug the UI visually, including the mobile layout

## URLs

The app uses **history routing** (plain paths) in local dev and on Vercel.
Only the GitHub Pages mirror uses hash URLs (`/#/highscores`).

| Page        | Local dev (`pnpm dev`)                                     |
| ----------- | ---------------------------------------------------------- |
| Game        | `http://localhost:5180/`                                   |
| Daily code  | `http://localhost:5180/daily`                              |
| High scores | `http://localhost:5180/highscores?difficulty=<difficulty>` |

`<difficulty>` is `easy`, `classic` or `hard`. Without a URL, default to the
game page. Unknown routes redirect to the game.

Deployed build (only if the user asks for it): `https://www.tyrko.app/` (Vercel).
Mirror: `https://kunukn.github.io/bulls-and-cows/` (GitHub Pages).

## Instructions

### 1. Make sure the dev server is running

Check with `curl -sf http://localhost:5180/ > /dev/null`. If it is not running,
start `pnpm dev` from the repo root as a **background** command with output to
`.temp/dev.log`, wait for the `Local:` line, then continue. Stop it at the end
only if this skill started it.

### 2. Load the page

1. Navigate to the URL and wait for it to load.
2. Take an accessibility snapshot (preferred for interaction) and a screenshot.
3. Describe the page: the daily code row, difficulty picker, board (hidden
   secret row, guess rows, bull/cow feedback), colour palette, timer, or the
   high-score table. The page restores a saved game, so the board may already
   hold guesses.

### 3. Interact with the game

- **Input:** number keys add a colour, in the palette's left-to-right order.
  Easy and Classic have 6 colours: `1` red, `2` orange, `3` yellow, `4` green,
  `5` cyan, `6` purple. Hard has 8: `1` red, `2` orange, `3` yellow, `4` green,
  `5` cyan, `6` blue, `7` purple, `8` pink. Each palette button's name states
  its key (`Add cyan (key 5)`), so read the snapshot when unsure. `←`/`→` move
  the target slot, `Backspace` undoes, `Enter` checks the row. Clicking palette
  buttons works too; clicking a filled peg in the active row clears it.
- **Reading feedback:** each scored row has screen-reader text such as
  `2 bulls, 1 cow` or `No matches`. Read it from the snapshot rather than
  counting dots in a screenshot.
- **The secret is hidden** (`?` pegs) until the game ends. Do not read it from
  app internals. To reach the win screen, play a consistent-guess solver: keep
  the list of codes that match every feedback so far and guess the first one.
  Classic is usually solved in about 5 guesses. For multi-step play, a single
  Playwright code run is far faster than one tool call per key.
- **Losing:** submit the same wrong row until guesses run out (10 on
  easy/classic, 12 on hard); the secret is then revealed.
- **Give up menu:** the `Give up` button above the board opens a menu with
  `New game` and `Reveal code`. Both act at once, with no confirm step.
- **Switching difficulty mid-game** opens an in-page dialog ("Abandon the
  current game?") once a peg has been placed. Click its `Abandon` or `Cancel`
  button; the browser dialog tool doesn't apply.
- **Winning** shows a name field, autofocused and prefilled with the last name
  used, if the run makes the top 10 and the High scores setting is on. Saving
  navigates to the high-score page.
- **Clearing high scores** opens a native `confirm()`. Handle it with the
  dialog tool, or the page blocks.
- **A reload keeps the current game**: it is saved to `localStorage` on every
  move and restored on load, finished games included.

### 4. Play the daily code

`/daily` is the same board on a second, separate game: one code per local
calendar day, Classic rules. The `Daily code #N` row on the game page links to
it and shows whether today's code is solved.

- **One attempt per day.** The `Give up` menu holds only `Reveal code`, and
  there is no `New game`. Winning, losing or revealing the code uses up the day
  for this browser profile, so say so before finishing a daily game the user
  didn't ask you to finish.
- **After the game** the panel shows stats (played, win rate, streak, best
  streak), a small chart of wins by number of guesses, a countdown to the next
  code, and a `Practice game` link back to the game page.
- **Another day:** use the browser's clock control (Playwright:
  `page.clock.setFixedTime(date)`) and reload. Don't edit the saved data to
  fake a date.

### 5. Inspect persisted data

`localStorage` keys:

- `app:game`: the practice game, in progress or finished
  (`{ version, value, context }`; `value` is `playing`, `won` or `lost`)
- `app:daily-game`: the daily game, in the same shape, with
  `context.dailyNumber`
- `app:daily`: daily results per day number,
  `{ results: { [number]: { isWon, guesses, elapsedMs } } }`
- `app:highscores`: `{ scores: { easy, classic, hard }, lastName }`,
  top 10 per difficulty, ranked by fewest guesses then fastest time
- `app:settings`: every Settings choice, plus the last chosen difficulty
- `app:language`: the interface language

Read them with the evaluate tool. Only clear or modify them if the user asks.

### 6. Check the mobile layout

The layout is mobile-first. When layout matters, resize to **360×780** and take
a full-page screenshot; the board must fit without horizontal scrolling.

## Ephemeral Artifacts

Write screenshots, snapshots, logs and scripts to the repo's `.temp/` folder only
(gitignored), never the repo root.

- Screenshots: `.temp/browse-<slug>-<timestamp>.png`
- Logs (console output, dev server, notes): `.temp/browse-<slug>.log`
- Pass an explicit `.temp/...` filename to screenshot tools. If a tool writes
  elsewhere by default, move the file into `.temp/` and report that path.

## Tips

- Check the console messages for errors after interacting; a clean run has only
  the React DevTools info line, plus the click-to-source key hints when
  `VITE_CODE_INSPECTOR=1` is set.
- Prefer accessibility snapshots over screenshots when you need to interact.
- Hover styles can linger in screenshots (e.g. a nav link looking active).
  Confirm active state via `aria-current="page"` before calling it a bug.
- Log real, out-of-scope bugs to `BUGS.md` using the format in
  `.github/copilot-instructions.md`.
