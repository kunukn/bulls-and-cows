# bulls-and-cows

A code-breaking game inspired by Mastermind. Crack the computer's secret colour
code; each guess earns **bulls** (right colour, right spot) and **cows** (right
colour, wrong spot).

## Develop

```bash
pnpm install
pnpm dev        # http://localhost:5176
pnpm test       # Vitest watch
pnpm check      # typecheck + lint
pnpm build
```

Keyboard: `1`–`8` add a colour, `Backspace` undoes, `Enter` checks the row.

Deploys to GitHub Pages from `main` via `.github/workflows/deploy.yml`.
