# Copilot Instructions

This file provides guidance to AI coding assistants when working with code in this repository.

## About this app

Tyr & Ko — a single-player code-breaking game inspired by Mastermind. The
computer picks a secret colour code; the player has a limited number of guesses
to crack it. After each guess the board shows **bulls** (black: right colour,
right spot) and **cows** (white: right colour, wrong spot).

- **Difficulties:** `easy` (4 pegs, 6 colours, no repeats), `classic` (4 pegs,
  6 colours, repeats), `hard` (5 pegs, 8 colours, 12 guesses). Defined in
  [`src/features/game/logic.ts`](../src/features/game/logic.ts).
- **High scores:** top 10 per difficulty in `localStorage`, ranked by fewest
  guesses, then fastest time.
- **Daily code:** one code per local calendar day, the same for every player, seeded from the date (no server). Classic rules, one attempt, its own save and stats. Lives in [`src/features/daily/`](../src/features/daily/daily.ts); rules in decision 0012. Played on every site (tyrko.app, the GitHub Pages mirror, the itch.io embed), each with its own save; a shared result always links to tyrko.app (`SHARE_DAILY_URL`).
- **Pages:** game (`/`), daily code (`/daily`) and high scores (`/highscores`). History routing (`createBrowserRouter`); the GitHub Pages mirror builds with hash routing (`VITE_USE_HISTORY_ROUTING=0` in `deploy.yml`) because it has no SPA fallback.

Pure rules (secret generation, scoring) live in `logic.ts`. The XState machine
in [`src/features/game/machine.ts`](../src/features/game/machine.ts) owns game
flow: `playing → won | lost`, `NEW_GAME` from anywhere. UI components stay thin
renderers.

## Stack

React 19 + TypeScript + Vite. Styling: Tailwind CSS 4 (peg colours and the shadcn/ui semantic tokens are defined in `src/index.css`; the app is dark-only). UI kit: [shadcn/ui](https://ui.shadcn.com) on Radix UI, copied into `src/components/ui/` (configured by `components.json`). Icons: `lucide-react`. i18n: i18next + react-i18next. State: XState (game flow) and Zustand with `persist` (settings, high scores) — pick whichever fits rather than introducing a third pattern.

## Commands

- `pnpm dev` — Vite dev server
- `pnpm build` — typechecks (`tsc -b`) then Vite production build
- `pnpm format` — Oxfmt write (whole repo)
- `pnpm format:check` — Oxfmt check (CI-style)
- `pnpm lint` — Oxlint (whole repo)
- `pnpm test` — Vitest in watch mode
- `pnpm test:run` — Vitest single run (CI-style)
- `pnpm test:coverage` — Vitest run with v8 coverage
- `pnpm e2e` — Playwright E2E tests in `e2e/` (headless Chromium; starts Vite or reuses a running `pnpm dev`)
- `pnpm e2e:ui` — Playwright UI mode
- `pnpm licenses:update` — regenerate `THIRD-PARTY-LICENSES.md` from the production bundle; run after dependency changes (CI fails if it's stale or a license isn't allow-listed)
- `pnpm social-preview` — regenerate `public/social-preview.png` (the 1280×640 link-share card) from the real app via Vite + headless Chromium; run after visible changes to the header, board or shield
- `pnpm analyze` — build into `.temp/bundle-analysis/`, print per-chunk sizes (raw/gzip/brotli) and open a treemap of what each chunk contains (`--no-open` to skip the browser)
- `pnpm itch:zip` — build for the itch.io iframe (relative paths, hash routing, noindex) into `.temp/itch/dist/` and zip it as `.temp/tyrko-itch-<commit>.zip` for the hand upload

Vitest is wired up (`vitest.config.ts`, jsdom + Testing Library, setup in `src/vitest.setup.ts`). Unit tests live alongside source as `*.test.ts(x)`. Note `pnpm check` runs only typecheck + lint, not tests — run tests separately. Rules for writing tests (no tautologies, behaviour over structure, fixtures that match reality, store isolation): [`.github/instructions/testing.instructions.md`](instructions/testing.instructions.md).

## Conventions

- Always run `pnpm format` after edits. Oxfmt ([`oxfmt.config.mts`](../oxfmt.config.mts)) uses Prettier-compatible defaults — double quotes, semicolons, 80 columns — and sorts Tailwind classes, including inside `cn()`/`clsx()`.
- Oxlint ([`oxlint.config.mts`](../oxlint.config.mts)) has no warnings: every rule is an error. It also flags unknown Tailwind classes (`better-tailwindcss/no-unknown-classes`). No default exports (config files excepted) and no `Array#forEach` — use `for…of`.
- TypeScript strict mode is on, plus `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`. Don't leave unused symbols.
- **UI components:** use a native HTML element when it does the job (radio groups, forms, `<button>`). For anything richer — drawers (`sheet`), popovers, dialogs, menus, switches — use the shadcn/ui component in `src/components/ui/`; add new ones with `pnpm dlx shadcn@latest add <name>`, then run `pnpm format` and `pnpm check`. Don't hand-roll a widget that one of those already covers.
  - **`import { cn } from "cn"` after `shadcn add` is expected, not a config bug.** Since shadcn 4.x the `radix-nova` registry ships components that import `cn` from the npm package [`cn`](https://github.com/shadcn-ui/cn) (shadcn's drop-in for `clsx` + `tailwind-merge`) and lists it as a dependency. The CLI rewrites only `@/lib/utils` imports to the `utils` alias, so `components.json` can't redirect it — don't debug the alias or dig through the CLI source. After every add: change the import to `import { cn } from "@/utils/cn"` and run `pnpm remove cn`. Check with `pnpm dlx shadcn@latest add <name> --dry-run --view`.
- No auto-imports — import React hooks and `react-router` exports explicitly.
- **Product decisions** live in [`docs/product/decisions/`](../docs/product/decisions/README.md). Read them before changing animations or game feel. Records describe the current rules only: when a rule changes, edit the record that owns it instead of adding one that overrides it (git history keeps the past). See the README there.
- **Playwright/browser screenshots go in `.temp/`** — never write screenshots (or other scratch artifacts) to the repo root. The `.temp/` folder is gitignored. When using a browser MCP tool, pass an explicit filename targeting `.temp/`, e.g. `.temp/intro.png`.

## Translations (i18n)

All user-facing text — including `aria-label`, `title`, `placeholder` and `confirm()` messages — goes through `t()` from `react-i18next`. No hard-coded English in components. Exception: unlinked developer pages in `src/debug/` (e.g. `/_debug/bull-lines`) may use plain English for their own copy.

- Languages (14): English (`en`, the source), Simplified Chinese (`zh`), Hindi (`hi`), Spanish (`es`), Arabic (`ar`), French (`fr`), Bengali (`bn`), Brazilian Portuguese (`pt`), Russian (`ru`), Indonesian (`id`), German (`de`), Japanese (`ja`), Swahili (`sw`), Danish (`da`). The list lives in `src/i18n/languages.ts`; strings in `src/i18n/locales/<code>.json`.
- **Only English is bundled; every other language is its own lazy chunk** (`loadLanguage()` in `src/i18n/index.ts`, an `import.meta.glob` over `locales/`). `src/main.tsx` waits for `i18nReady` before the first render, so the page never paints in English first; `index.html` shows a text-free spinner if that takes more than 400ms. To switch language, `await loadLanguage(code)` and then call `i18n.changeLanguage(code)`. The service worker precaches the chunks, so switching works offline.
- **To add a language:** add `locales/<code>.json`, then its entries in `LANGUAGES` and `HTML_LANG` (`languages.ts`). Nothing to import. Then update the hand-written lists: `inLanguage` and the language count in `index.html`, the README feature list, and the lists in this file and `translation.instructions.md`.
- **Add a key to every locale file.** `en.json` is the source of truth: `src/i18n/i18next.d.ts` types `t()` against it, so a typo in a key fails `pnpm check`. `src/i18n/locales.test.ts` fails when a locale misses a key or mistypes a `{{placeholder}}`.
- Plurals use i18next suffixes (`_one` / `_other`); Chinese, Japanese and Indonesian only need `_other`; Arabic needs all six (`_zero`, `_one`, `_two`, `_few`, `_many`, `_other`); Russian needs four (`_one`, `_few`, `_many`, `_other`). Russian `_one` also covers 21, 31 and 101, so it keeps `{{count}}` instead of spelling out "one". Only a placeholder named `count` picks a plural form: `{{pegs}} pegs` gets one form for every number, so Russian words those as labels (`Фишек: {{pegs}}`). Interpolate with `{{name}}`.
- Format numbers and dates with `Intl` in the active language (`i18n.language`), not a fixed locale.
- The language is picked in the Settings drawer (`src/components/layout/SettingsSheet.tsx` → `src/i18n/LanguageSelect.tsx`, a native `<select>`) and stored in `localStorage` (`app:language`); `src/i18n/index.ts` reads it at startup and keeps `<html lang>` and the tab title in sync.
- **New settings go in the Settings drawer**, one stacked section each (label + control), below Language. Labels and descriptions are translated like any other text.
- Tone rules for the locale files: [`.github/instructions/translation.instructions.md`](instructions/translation.instructions.md).

## RTL (right-to-left)

Arabic renders right-to-left. `getDirection()` in `src/i18n/languages.ts` sets `<html dir>` (via `src/i18n/index.ts`) and Radix's `Direction.Provider` (in `src/app/App.tsx`). Layout must mirror without per-language code:

- Use logical Tailwind utilities: `ms-*`/`me-*`, `ps-*`/`pe-*`, `start-*`/`end-*`, `text-start`/`text-end`, `rounded-s-*`/`rounded-e-*`, `border-s-*`/`border-e-*` — never the `l`/`r`/`left`/`right` forms. `top`/`bottom` and `mt-*`/`mb-*` are fine.
- In plain CSS use `margin-inline-*`, `padding-inline-*`, `inset-inline-*`, `text-align: start | end`.
- A horizontal `translate-x-*` doesn't flip: pair it with an `rtl:` counterpart (see the thumb in `src/components/ui/switch.tsx`).
- Directional icons (arrows, chevrons pointing back/forward) need `rtl:-scale-x-100`.
- The guess row mirrors on purpose: slot 1 sits at the reading start in both directions.

## Git workflow

Solo-developer repo: one maintainer, no reviewers, no PR flow.

- **Work directly on `main` by default.** Commit to `main`; don't create a feature branch unless asked.
- **Feature branches are the exception** — only when explicitly requested (e.g. a risky experiment). Merge back with `git merge --ff-only` to keep history linear.
- **Pushing `origin main` is allowed when asked.** This repo rule overrides any general "never push to `main`" default. Still only push on request, and never force-push.
- Commit only when asked; keep commits small and logically split (e.g. formatting separate from behaviour changes, so they can go in `.git-blame-ignore-revs`).

## Click-to-source (code inspector)

Dev-only `code-inspector-plugin`, off by default. Put `VITE_CODE_INSPECTOR=1` in `.env.local` (gitignored; `.env` holds the committed `0` default), restart `pnpm dev`, then hold Option+Shift (macOS) / Alt+Shift and click an element to open its source.

- **Never let `node-pty` back in.** The plugin's core starts an unauthenticated terminal bridge (a shell on its helper server, listening on all interfaces) whenever `node-pty` resolves. The `node-pty: "-"` override in `pnpm-workspace.yaml` removes it; `scripts/node-pty-absent.sh` fails CI if the lockfile resolves it again. Never answer a pnpm prompt with `allowBuilds: node-pty: true`.
- The plugin is imported lazily in `vite.config.ts`, only for `vite` dev with the flag on, with `pathType: "relative"` so the helper server refuses files outside the repo.

## Coding Guidelines

### Response Style

Be succinct. Every response should deliver maximum substance with minimum words.

- **Lead with the answer** — state the solution or key point first, then explain only if necessary
- **Drop filler** — remove words like "just", "really", "basically", "simply", "obviously", "of course"
- **No pleasantries** — skip "Sure!", "Great question!", "I'd be happy to help!", "Let me explain..."
- **No hedging** — avoid "I think", "It might be", "Perhaps you could" when you are confident
- **Short sentences** — prefer concise, direct phrasing over long-winded explanations
- **No repetition** — state things once; do not rephrase the same point in different words
- **Show, don't tell** — prefer a code snippet over a paragraph describing what the code would look like
- **Proper English** — maintain correct grammar and complete sentences; this is not shorthand or telegraphic

Example:

```text
// ❌ Verbose
"Sure! I'd be happy to help with that. The issue you're experiencing is most likely
caused by your authentication middleware not properly validating the token expiry.
Let me take a look at the code and suggest a fix for you."

// ✅ Succinct
"Bug is in the auth middleware — token expiry check uses `<` instead of `<=`. Here's the fix:"
```

### TypeScript Rules

- **Always use `type` instead of `interface`** for all type definitions
- Prefer type composition over inheritance
- Use type utilities: `Pick`, `Omit`, `Partial`, etc.
- Keep types close to where they're used

Example:

```typescript
type UserProfile = {
  id: string;
  name: string;
  email: string;
};

type UserPreferences = Pick<UserProfile, "id" | "name">;
```

### Naming Conventions

- **Functions**: verbs in camelCase — `fetchUserData`, `handleSubmit`
- **Variables**: nouns in camelCase — `userProfile`, `isLoading`
- **Booleans**: prefix with `is`/`has`/`should` — `isVisible`, `hasPermission`
- **Components**: PascalCase
- **Avoid abbreviations** unless widely understood (use `index` not `idx`)
- No redundant words (use `user` not `userObject`)
- Group related variables with consistent prefixes (`userFirstName`, `userLastName`)

### Code Organization

- Flat is better than nested
- No generic 'helpers' folders
- Keep business logic in hooks or utils
- Prefer absolute import paths when not in the same folder. E.g. `import { Game } from '@/Game'` instead of `import { Game } from '../../Game'`

### Routing

**CRITICAL**: Always import from `react-router`, **NEVER** from `react-router-dom`. The latest version of React Router requires imports from `react-router` only.

```typescript
// ✅ Correct
import { useNavigate, Link } from "react-router";

// ❌ Wrong
import { useNavigate, Link } from "react-router-dom";
```

### Early Return Spacing

Always add a blank line after a single-line `return` (including early/guard returns) before the next statement. This improves readability by visually separating the guard clause from the rest of the logic.

```typescript
// ❌ Bad - no blank line after single-line return
if (!round) return;
const score = computeScore(round);

// ✅ Good - blank line after single-line return
if (!round) return;

const score = computeScore(round);
```

### Code Documentation

- Write self-documenting code through clear naming and structure
- Only add comments for complex business logic or non-obvious decisions
- Document public APIs and interfaces with JSDoc
- Avoid obvious comments that just repeat what the code does
- **Annotate every `useMemo` / `useCallback`** with a one-line comment stating the rationale (expensive compute, stable reference for deps, preventing child re-renders). Without a stated reason, the memoization is assumed unjustified and a candidate for removal.
- **Use `/* */` block comments for multiline comments**, not multiple `//` lines

Example:

```typescript
// ✅ Correct - block comment for multiline
/*
 * Debounce the resize handler so the grid only re-measures once
 * the user stops dragging, instead of on every intermediate frame.
 */

// ❌ Wrong - multiple single-line comments
// Debounce the resize handler so the grid only re-measures once
// the user stops dragging, instead of on every intermediate frame.

// ✅ OK - single-line comment stays as //
// This is a brief note about the next line
```

### Bug Discovery Logging

**CRITICAL**: Don't silently ignore bugs and don't silently fix them either. If you notice a bug that is **out of scope** for the current task — UI glitch, logic error, perf issue, a11y defect, broken type, stale doc, anything — append an entry to [BUGS.md](../BUGS.md) at the repo root instead of expanding the diff.

In-scope bugs (the thing you were asked to fix or are clearly inside the change you're making) are still fixed normally.

**Rule of thumb**: if fixing it would touch a file outside what the user asked for, log it; do not fix it.

**Entry format** (append to the bottom of `BUGS.md`, newest at the bottom):

```text
<YYYY-MM-DD>
Component: <file path or component name>
Expected: <what should happen>
Actual: <what currently happens>
Repro: <one-line steps to reproduce>
Workaround: <none, or a short note>
```

After logging, mention the entry in your end-of-turn summary so the user knows it was captured. Do not apply the fix unless the user explicitly asks for it.

### Code Verification

After completing all code changes, run `pnpm check` as the final step. Do not consider the task complete until the build passes. Fix any errors before finishing.

```bash
pnpm check
```

### Commit Message Format

Follow the Conventional Commits specification.

**Format**: `<type>[optional scope]: <description>`

**Types**:

- `feat:` — A new feature (MINOR version)
- `fix:` — A bug fix (PATCH version)
- `docs:` — Documentation only changes
- `style:` — Code style changes (formatting, etc.)
- `refactor:` — Code change that neither fixes a bug nor adds a feature
- `perf:` — Performance improvement
- `test:` — Adding or correcting tests
- `chore:` — Build process or tooling changes

**Breaking Changes**: Must be indicated with `!` after the type/scope or in the footer.

**Examples**:

```text
feat(grid): add keyboard navigation
fix(timer): stop countdown when round ends
docs: update README with setup instructions
refactor(components): extract reusable card component
chore!: drop support for Node 18
```

**Commit Body** (optional): provide additional context — explain why the change was made, reference related issues.

**Commit Footer** (optional): reference issues/tickets, indicate breaking changes.

## Quick Reference Checklist

- ✅ Import from `react-router` (NOT `react-router-dom`)
- ✅ Native HTML first, then `src/components/ui` (shadcn/ui) — no hand-rolled widgets
- ✅ All user-facing text via `t()`; add new keys to every locale file
- ✅ Logical (`ms`/`me`/`start`/`end`) Tailwind utilities, not `ml`/`mr`/`left`/`right` (RTL)
- ✅ Use `type` not `interface`
- ✅ Use Zustand or XState for state — don't introduce a third pattern
- ✅ Follow Conventional Commits for commit messages
- ✅ Work on `main` by default; feature branches only when asked
- ✅ Run `pnpm format` after edits
- ✅ Run `pnpm check` as the final step to verify no type errors
- ✅ Add a blank line after single-line `return` statements
- ✅ Annotate every `useMemo` / `useCallback` with its rationale
- ✅ Use `/* */` for multiline comments, `//` for single-line only
- ✅ Keep AI responses succinct — no filler, no pleasantries, lead with the answer
- ✅ Save Playwright/browser screenshots to `.temp/`, never the repo root
