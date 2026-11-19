# 0008 — Light mode for the interface, and always light when printing

- **Status:** Accepted
- **Date:** 2026-11-19

## Context

The app was dark-only. Printers drop background colours, so a printed page (high scores, a finished game) came out as pale text on white paper. Some players also prefer a light interface.

## Decision

An **Appearance** choice in Settings, **Dark** or **Light** (Dark by default), sets the app interface. It is a segmented native radio group rather than a Light mode switch: a switch can't grow to a third System option, and a Dark mode switch would be on by default. Printing is always light, whatever the setting. Board themes are not affected: the board keeps its look in both modes.

## Alternatives considered

- **Print-only light styles.** Fixes printing, but gives players no light option on screen.
- **Follow the system setting (`prefers-color-scheme`).** Would flip existing dark players to light without asking; the game's identity is dark. Could be a third option later.
- **A Light mode or Dark mode switch.** Can't hold a System option. Named "Light mode" it is off by default; named "Dark mode" it is more familiar but on by default. "Theme" was also ruled out: it clashes with board themes.
- **Light board themes too.** Each board theme is tuned so white cows and black bulls read clearly; re-tuning all of them for light is a separate decision.

## Consequences

- Colours come from tokens in `src/index.css`, each `light-dark(<light>, <dark>)`. `color-scheme` on `<html>` picks the side (`data-color-scheme`, set from the settings store). Components use token classes (`bg-card`, `text-subtle`, `text-muted-foreground`…), not raw `slate-*` classes.
- Board parts must use `--board-*` tokens. Lightning CSS polyfills `light-dark()` with variables that resolve at `:root`, so an app token inside the board would follow the page scheme.
- Fixed-colour buttons (green Check, amber Save) and peg overlays stay the same in both modes.
