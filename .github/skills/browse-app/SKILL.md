---
name: browse-app
version: 1.0.0
description: Browse and interact with the running Bulls & Cows game using any available browser MCP tools (Playwright MCP, Chrome DevTools MCP, or similar). Use when the user wants to open the app, inspect a page, play or test a game flow, check the high-score page, or visually debug the UI.
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

Browse and interact with the running Bulls & Cows game (a Mastermind-style
code-breaker) using whichever browser MCP tools are connected in the current
session (e.g. Playwright MCP, Chrome DevTools MCP).

## When to Use

- Open the app, or a specific page, and describe it
- Play or test a game flow (guess, win, lose, switch difficulty)
- Check the high-score page or persisted data
- Debug the UI visually, including the mobile layout

## URLs

The app uses a **hash router** (GitHub Pages has no SPA fallback), so routes
live after `#`.

| Page        | Local dev (`pnpm dev`)                                       |
| ----------- | ------------------------------------------------------------ |
| Game        | `http://localhost:5176/#/`                                   |
| High scores | `http://localhost:5176/#/highscores?difficulty=<difficulty>` |

`<difficulty>` is `easy`, `classic` or `hard`. Without a URL, default to the
game page. Unknown routes redirect to the game.

Deployed build (only if the user asks for it, and only when GitHub Pages is
enabled): `https://kunukn.github.io/bulls-and-cows/`.

## Instructions

### 1. Make sure the dev server is running

Check with `curl -sf http://localhost:5176/ > /dev/null`. If it is not running,
start `pnpm dev` from the repo root as a **background** command with output to
`.temp/dev.log`, wait for the `Local:` line, then continue. Stop it at the end
only if this skill started it.

### 2. Load the page

1. Navigate to the URL and wait for it to load.
2. Take an accessibility snapshot (preferred for interaction) and a screenshot.
3. Describe the page: difficulty picker, board (hidden secret row, guess rows,
   bull/cow feedback), colour palette, timer, or the high-score table.

### 3. Interact with the game

- **Input:** keys `1`–`8` add a colour (`1` red, `2` blue, `3` green,
  `4` yellow, `5` purple, `6` orange, `7` pink, `8` cyan; the palette has 6
  colours on easy/classic, 8 on hard). `Backspace` undoes, `Enter` checks the
  row. Clicking palette buttons works too; clicking a filled peg in the active
  row clears it.
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
- **Switching difficulty mid-game** opens a native `confirm()` ("Abandon the
  current game?"). Handle it with the dialog tool, or the page blocks.
- **Winning** shows a name field, autofocused and prefilled with the last name
  used, if the run makes the top 10. Saving navigates to the high-score page.
- **Reload ends the current game**: game state is in memory only.

### 4. Inspect persisted data

`localStorage` keys (Zustand `persist`):

- `bulls-and-cows:highscores`: `{ scores: { easy, classic, hard }, lastName }`,
  top 10 per difficulty, ranked by fewest guesses then fastest time
- `bulls-and-cows:settings`: last chosen difficulty

Read them with the evaluate tool. Only clear or modify them if the user asks.

### 5. Check the mobile layout

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
  the React DevTools info line.
- Prefer accessibility snapshots over screenshots when you need to interact.
- Hover styles can linger in screenshots (e.g. a nav link looking active).
  Confirm active state via `aria-current="page"` before calling it a bug.
- Log real, out-of-scope bugs to `BUGS.md` using the format in
  `.github/copilot-instructions.md`.
