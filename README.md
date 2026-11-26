# <img src="public/favicon.svg" width="32" height="32" align="absmiddle" alt="bull logo" /> Tyr & Ko

[![License: 0BSD](https://img.shields.io/badge/license-0BSD-green.svg)](LICENSE)
[![Live](https://img.shields.io/badge/live-tyrko.app-blue)](https://www.tyrko.app/)

**Crack the computer's secret colour code before you run out of guesses.**

A code-breaking game inspired by Mastermind. Each guess earns **bulls** (black:
right colour, right spot) and **cows** (white: right colour, wrong spot). The
pegs don't say which spot they mean — that's the puzzle.

The name is Danish: _tyr_ is bull, _ko_ is cow — the classic game
Bulls & Cows, in the language of the maker.

## 🌐 Try It

**[www.tyrko.app](https://www.tyrko.app)** · [kunukn.github.io/bulls-and-cows](https://kunukn.github.io/bulls-and-cows) · [itch.io](https://kunukn.itch.io/tyr-and-ko)

<img src="docs/qr-live-demo.png" alt="QR code for live demo" width="198" />

## ✨ What's Inside

| Difficulty | Pegs | Colours | Guesses | Repeats |
| ---------- | ---- | ------- | ------- | ------- |
| Easy       | 4    | 6       | 10      | No      |
| Classic    | 4    | 6       | 10      | Yes     |
| Hard       | 5    | 8       | 12      | Yes     |

- 📅 **Daily code** — one code a day, the same for everyone, with one try.
  Streaks and stats are stored locally in your browser.
- 🏆 **High scores** — top 10 per difficulty, ranked by fewest guesses, then
  fastest time. Stored locally in your browser.
- 🌍 **14 languages** — English, 简体中文, हिन्दी, Español, العربية (right-to-left), Français, বাংলা, Português, Русский, Bahasa Indonesia, Deutsch, 日本語, Kiswahili, Dansk.
- ⌨️ **Keyboard support** — `1`–`8` add a colour, `Backspace` undoes, `Enter`
  checks the row.

## 🛠️ Develop

```bash
pnpm install
pnpm dev        # http://localhost:5180
pnpm test       # Vitest watch
pnpm check      # typecheck + lint (oxlint)
pnpm format     # oxfmt, whole repo
pnpm build
```

Built with React 19, TypeScript, Vite, Tailwind CSS 4, shadcn/ui and XState.

Every push to `main` deploys to Vercel ([www.tyrko.app](https://www.tyrko.app))
through its GitHub integration; pull requests get preview URLs.
`.github/workflows/deploy.yml` also publishes a hash-routed mirror to GitHub
Pages.

The [itch.io page](https://kunukn.itch.io/tyr-and-ko) is uploaded by hand as
a ZIP. itch serves the game from a subfolder inside an iframe, so it needs
relative paths and hash routing. The ZIP is named after the commit, which
itch shows on its edit page; the same hash is in the game's Settings footer.

```bash
pnpm itch:zip   # → .temp/tyrko-itch-<commit>.zip
```
