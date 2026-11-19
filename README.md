# <img src="public/favicon.svg" width="32" height="32" align="absmiddle" alt="bull logo" /> Bulls & Cows

[![License: 0BSD](https://img.shields.io/badge/license-0BSD-green.svg)](LICENSE)
[![Live](https://img.shields.io/badge/live-GitHub%20Pages-blue)](https://kunukn.github.io/bulls-and-cows/)

**Crack the computer's secret colour code before you run out of guesses.**

A code-breaking game inspired by Mastermind. Each guess earns **bulls** (black:
right colour, right spot) and **cows** (white: right colour, wrong spot). The
pegs don't say which spot they mean — that's the puzzle.

## 🌐 Try It

**[kunukn.github.io/bulls-and-cows](https://kunukn.github.io/bulls-and-cows/)**

<img src="docs/qr-live-demo.png" alt="QR code for live demo" width="200" />

## ✨ What's Inside

| Difficulty | Pegs | Colours | Guesses | Repeats |
| ---------- | ---- | ------- | ------- | ------- |
| Easy       | 4    | 6       | 10      | No      |
| Classic    | 4    | 6       | 10      | Yes     |
| Hard       | 5    | 8       | 12      | Yes     |

- 🏆 **High scores** — top 10 per difficulty, ranked by fewest guesses, then
  fastest time. Stored locally in your browser.
- 🌍 **Seven languages** — English, 简体中文, हिन्दी, العربية (right-to-left), Français, Deutsch, Dansk.
- ⌨️ **Keyboard support** — `1`–`8` add a colour, `Backspace` undoes, `Enter`
  checks the row.

## 🛠️ Develop

```bash
pnpm install
pnpm dev        # http://localhost:5176
pnpm test       # Vitest watch
pnpm check      # typecheck + lint (oxlint)
pnpm format     # oxfmt, whole repo
pnpm build
```

Built with React 19, TypeScript, Vite, Tailwind CSS 4, shadcn/ui and XState.

Deploys to GitHub Pages from `main` via `.github/workflows/deploy.yml`.
