import { useSettings } from "./settings";

afterEach(() => {
  useSettings.getState().setColorScheme("dark");
});

test("starts dark and mirrors the scheme onto <html>", () => {
  expect(useSettings.getState().colorScheme).toBe("dark");
  expect(document.documentElement.dataset.colorScheme).toBe("dark");
});

test("switching to light updates <html>", () => {
  useSettings.getState().setColorScheme("light");

  expect(document.documentElement.dataset.colorScheme).toBe("light");
});

test("moves a saved Metal board to Felt", async () => {
  localStorage.setItem(
    "bulls-and-cows:settings",
    JSON.stringify({ state: { boardTheme: "gunmetal" }, version: 0 }),
  );

  await useSettings.persist.rehydrate();

  expect(useSettings.getState().boardTheme).toBe("felt");
});
