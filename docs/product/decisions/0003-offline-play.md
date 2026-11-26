# 0003 — The game works offline and updates silently

- **Status:** Accepted
- **Updated:** 2026-11-20

## Context

The game is fully client-side: secret generation, scoring and high scores all live in the browser. A network round-trip is only needed to fetch the app itself, so a lost connection (train, plane, flaky Wi-Fi) shouldn't stop a game.

## Decision

The app is an installable PWA that precaches everything it needs, sounds included, and picks up new deploys without asking.

- **`vite-plugin-pwa` (Workbox `generateSW`)** precaches the build output and `public/sounds/*`, so the first offline launch has audio too.
- **Silent auto-update** (`registerType: "autoUpdate"`): a new deploy activates on the next load; an open tab checks hourly. No "new version" prompt.
- **Relative `start_url` / `scope`** so one config serves both `/` and the GitHub Pages subpath.

## Alternatives considered

- **Update prompt / "Ready offline" toast.** Extra UI and a string to translate in every language for little gain: there's no server state an update could break, and a game in progress survives a reload.
- **Hand-written service worker.** No dependency, but re-implements Workbox's cache versioning and cleanup.
- **Manifest only.** Installable, but still needs the network.

## Consequences

- New file types in `public/` must match `workbox.globPatterns` in `vite.config.ts` or they won't be available offline.
- Languages other than English are lazy chunks (`src/i18n/index.ts`). They are `.js` files in the build, so they are precached too and a language switch works offline. Until the service worker has installed (a first visit that loses its connection), a switch can fail: Settings then says so and keeps the current language.
- `pnpm dev` has no service worker; test offline behaviour with `pnpm build && pnpm preview`.
- `workbox-window` (~2 kB gzip) ships in the bundle.
