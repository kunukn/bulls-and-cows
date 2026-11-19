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
