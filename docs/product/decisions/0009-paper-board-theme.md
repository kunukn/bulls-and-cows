# 0009 — A light board theme: Paper

- **Status:** Accepted
- **Date:** 2026-11-19

## Context

Light mode (0008) lightens the interface, but all four board themes are dark, so a light-mode player still gets a dark board. 0008 left light boards as a separate decision because white cow pegs and empty holes are hard to see on a light surface.

## Decision

A fifth board theme, Paper: graph paper in slate and sky, the light counterpart of Neon. It is a choice like any other theme, not tied to light mode, and Neon stays the default.

## Alternatives considered

- **Switch the board with light mode.** Would override a theme the player picked; the board and the interface stay independent (0008).
- **Make each theme light-aware.** Four themes to re-tune and test twice, for little gain.

## Consequences

- White cow pegs get an outline from a `--board-cow-ring` token. It is transparent on the dark themes, so they look the same as before.
- Holes are slate with a darker rim and inset shadow, so they read as holes, not dots.
- The theme picker now has five swatches; Paper sits alone on the last row.
