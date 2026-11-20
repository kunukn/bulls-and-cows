---
applyTo: "**/*.test.ts,**/*.test.tsx,e2e/**/*.ts,src/vitest.setup.ts"
---

# Testing instructions

A test earns its place when a real bug turns it red and a harmless refactor doesn't. For every test, name the product change that would fail it. "None" means it's tautological; "renaming or restructuring internals" means it's too structure-sensitive. Rewrite or delete either kind.

**Mutation check:** after writing a test, break the code it guards (flip a default, drop a branch, swap a constant) and confirm the test goes red. If it stays green, it doesn't test that code.

## Tautologies: tests that can't fail

- Don't assert what the implementation's shape already guarantees, e.g. that `pickInsertAnimation` returns a member of `PEG_INSERT_ANIMATIONS` when it indexes that very array.
- Don't recompute the expected value with the code's own formula and constants. `delays[1] - delays[0] === delays[3] - delays[2]` restates `index * STAGGER + offset`. Assert a contract a plausible bug would break instead: an ordering, a relationship between two outputs, or a hand-computed example.
- A purity test ("same input → same output") is only worth it when it guards a stated rule, such as "no `Math.random()`, so re-renders stay pure". Say so in the test name.

## Structure-sensitive: tests that fail on harmless changes

- Test behaviour through the public surface: events sent in, `context` fields the UI reads, and emitted events out. In `gameMachine`, `current`, `target` (the pressed slot) and emitted events are the contract. `placed` is the internal undo stack, so test it through `REMOVE_PEG` order. Persistence tests are the exception, because there the saved shape is the contract.
- Derive limits from config (`DIFFICULTIES.classic.maxGuesses`, `paletteFor(difficulty)`) instead of writing `10` or a colour list. Pin a literal only where it _is_ the spec under test, like the palette-order test in `logic.test.ts`.
- E2E: don't hard-code colours that only some palettes offer. Use one every difficulty shares, or pick palette buttons by position. Don't compare against literal token values (`oklch(…)`). Compare against a reference measured in the same run instead: before vs after, dark vs light.
- Query by role and accessible name, as the existing specs do. Never use CSS classes or DOM structure.

## Fixtures and mocks must match reality

- Send only inputs the real app can produce. The machine doesn't check the palette (the UI does), so a machine test that adds `blue` on Classic exercises a state no player can reach. `loadGame()` would also reject that state. Use colours from `paletteFor(difficulty)`.
- Hand-write storage JSON only for legacy or corrupt saves. Produce current-format data through the real writer (`saveGame` via `actor.subscribe`, or the store's own actions) so the fixture can't drift from the code.
- `src/vitest.setup.ts` stubs `ResizeObserver` and `IntersectionObserver` as no-ops that never fire, and makes `fetch` reject. In Vitest, nothing driven by layout or the network actually runs. Cover that behaviour in e2e, or stub it per test with callbacks that fire the way the browser does.
- Keep comments that describe fixtures true. A comment naming the wrong seeded secret misleads the next author more than no comment would.

## Isolation

- Zustand stores are module singletons, and `persist` writes to jsdom `localStorage`, which survives between tests in a file. Reset both in `beforeEach` so each test starts as a new player and test order doesn't matter:

  ```ts
  beforeEach(() => {
    localStorage.clear();
    useSettings.setState(useSettings.getInitialState(), true);
  });
  ```

- Assert new-player defaults on a fresh store, never after another test has rehydrated it.
