import { useSettings } from "./settings";

/* Each test starts as a new player: no save, store back to its defaults. */
beforeEach(() => {
  localStorage.clear();
  useSettings.setState(useSettings.getInitialState(), true);
});

test("starts dark and mirrors the scheme onto <html>", () => {
  expect(useSettings.getState().colorScheme).toBe("dark");
  expect(document.documentElement.dataset.colorScheme).toBe("dark");
});

test("auto check is on for new players", () => {
  expect(useSettings.getState().isAutoSubmit).toBe(true);
});

test("high scores are on for new players", () => {
  expect(useSettings.getState().isHighScoresEnabled).toBe(true);
});

test("hints are on for new players (0011)", () => {
  expect(useSettings.getState().isHintsEnabled).toBe(true);
});

test("switching to light updates <html>", () => {
  useSettings.getState().setColorScheme("light");

  expect(document.documentElement.dataset.colorScheme).toBe("light");
});

test("moves a saved Metal board to Felt", async () => {
  localStorage.setItem(
    "app:settings",
    JSON.stringify({ state: { boardTheme: "gunmetal" }, version: 0 }),
  );

  await useSettings.persist.rehydrate();

  expect(useSettings.getState().boardTheme).toBe("felt");
});

test("new players start on Easy", () => {
  expect(useSettings.getState().difficulty).toBe("easy");
});

test("a saved difficulty survives rehydrate", async () => {
  localStorage.setItem(
    "app:settings",
    JSON.stringify({ state: { difficulty: "hard" }, version: 2 }),
  );

  await useSettings.persist.rehydrate();

  expect(useSettings.getState().difficulty).toBe("hard");
});

test("pegs show colour only for new players", () => {
  expect(useSettings.getState().pegStyle).toBe("color");
});

test("moves a saved Shapes switch to the colour + shape peg style", async () => {
  localStorage.setItem(
    "app:settings",
    JSON.stringify({ state: { isPegShapes: true }, version: 1 }),
  );

  await useSettings.persist.rehydrate();

  expect(useSettings.getState().pegStyle).toBe("colorShape");
  expect(useSettings.getState()).not.toHaveProperty("isPegShapes");
});
