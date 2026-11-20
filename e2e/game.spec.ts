import { expect, test } from "@playwright/test";

test("starts a game and scores the first guess", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByLabel("Secret code (hidden)")).toBeVisible();

  const checkButton = page.getByRole("button", { name: "Check" });
  await expect(checkButton).toBeDisabled();

  // Auto check is on by default (0008): the fourth peg scores the row.
  for (const color of ["red", "cyan", "green", "yellow"]) {
    await page.getByRole("button", { name: `Add ${color}` }).click();
  }

  // Screen-reader summary of the scored row, e.g. "1 bull, 2 cows".
  await expect(
    page.getByLabel("Board").getByText(/bulls?, \d+ cows?|No matches/),
  ).toBeAttached();
});

test("game menu restarts without revealing the code", async ({ page }) => {
  await page.goto("/");

  const firstSlot = page.getByRole("button", { name: /^Slot 1/ }).first();
  await page.getByRole("button", { name: "Add red" }).click();
  await expect(firstSlot).toHaveAccessibleName(/^Slot 1: red/);

  // Opening the menu is the confirm step; New game acts at once.
  await page.getByRole("button", { name: "Give up" }).click();
  await page.getByRole("menuitem", { name: "New game" }).click();

  await expect(firstSlot).toHaveAccessibleName("Slot 1, empty");
  await expect(page.getByLabel("Secret code (hidden)")).toBeVisible();
});

test("explains the rules from the How it works button", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "How it works" }).click();

  const help = page.getByRole("dialog");
  await expect(help.getByText("How to play")).toBeVisible();
  await expect(help.getByText("Difficulties")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(help).toBeHidden();
});

test("light mode lightens the app but not the board", async ({ page }) => {
  await page.goto("/");
  const board = page.getByLabel("Board");
  const boardBackground = await board.evaluate(
    (element) => getComputedStyle(element).backgroundImage,
  );

  await page.getByRole("button", { name: "Settings" }).click();
  // The radio input is visually hidden; click its label like a player would.
  await page
    .getByRole("group", { name: "Appearance" })
    .getByText("Light", { exact: true })
    .click();
  await page.keyboard.press("Escape");

  await expect(page.locator("html")).toHaveAttribute(
    "data-color-scheme",
    "light",
  );
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "oklch(0.968 0.007 247.896)",
  );
  expect(
    await board.evaluate(
      (element) => getComputedStyle(element).backgroundImage,
    ),
  ).toBe(boardBackground);
});

test("printing is light even in dark mode", async ({ page }) => {
  await page.goto("/");
  await page.emulateMedia({ media: "print" });

  await expect(page.locator("html")).toHaveAttribute(
    "data-color-scheme",
    "dark",
  );
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "oklch(0.968 0.007 247.896)",
  );
});
