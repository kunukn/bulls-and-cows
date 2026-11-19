import { expect, test } from "@playwright/test";

test("starts a game and scores the first guess", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByLabel("Secret code (hidden)")).toBeVisible();

  const checkButton = page.getByRole("button", { name: "Check" });
  await expect(checkButton).toBeDisabled();

  // Auto check is on by default (0012): the fourth peg scores the row.
  for (const color of ["red", "blue", "green", "yellow"]) {
    await page.getByRole("button", { name: `Add ${color}` }).click();
  }

  // Screen-reader summary of the scored row, e.g. "1 bull, 2 cows".
  await expect(
    page.getByLabel("Board").getByText(/bulls?, \d+ cows?|No matches/),
  ).toBeAttached();
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
