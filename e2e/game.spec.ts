import { expect, test } from "@playwright/test";

test("starts a game and scores the first guess", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByLabel("Secret code (hidden)")).toBeVisible();

  const checkButton = page.getByRole("button", { name: "Check" });
  await expect(checkButton).toBeDisabled();

  for (const color of ["red", "blue", "green", "yellow"]) {
    await page.getByRole("button", { name: `Add ${color}` }).click();
  }
  await expect(checkButton).toBeEnabled();

  await checkButton.click();

  // Screen-reader summary of the scored row, e.g. "1 bull, 2 cows".
  await expect(
    page.getByLabel("Board").getByText(/bulls?, \d+ cows?|No matches/),
  ).toBeAttached();
});
