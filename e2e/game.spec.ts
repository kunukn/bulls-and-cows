import { expect, test, type Locator } from "@playwright/test";

/*
 * Relative luminance (0 dark … 1 light) of an element's background colour.
 * Painted to a 1px canvas so any CSS colour format reads as RGB, and the
 * tests survive palette tweaks instead of pinning an exact oklch() value.
 */
function getBackgroundLightness(locator: Locator): Promise<number> {
  return locator.evaluate((element) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No 2D canvas context");

    context.fillStyle = getComputedStyle(element).backgroundColor;
    context.fillRect(0, 0, 1, 1);
    const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;

    return (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
  });
}

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

test("high scores offer a new game only once the game is over", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "High scores" }).click();
  const newGame = page.getByRole("button", { name: "New game" });
  // Mid-game, the CTA would throw away the game in progress.
  await expect(newGame).toBeHidden();

  await page.getByRole("link", { name: "Play" }).click();
  await page.getByRole("button", { name: "Give up" }).click();
  await page.getByRole("menuitem", { name: "Give up" }).click();
  await expect(page.getByLabel("Secret code (hidden)")).toBeHidden();

  await page.getByRole("link", { name: "High scores" }).click();
  await newGame.click();

  await expect(page).toHaveURL((url) => url.pathname === "/" && !url.hash);
  await expect(page.getByLabel("Secret code (hidden)")).toBeVisible();
});

test("the High scores switch turns the name prompt off and on", async ({
  page,
}) => {
  await page.goto("/");
  // The game is saved on its first event; a new game writes one with its secret.
  await page.getByRole("button", { name: "Give up" }).click();
  await page.getByRole("menuitem", { name: "New game" }).click();
  const secret = await page.evaluate<string[]>(
    () => JSON.parse(localStorage.getItem("app:game") ?? "{}").context.secret,
  );

  // Auto check (0008) scores the row on the last peg, which wins the game.
  for (const color of secret) {
    await page.getByRole("button", { name: `Add ${color}` }).click();
  }

  const nameField = page.getByRole("textbox", { name: "Your name" });
  const highScoresSwitch = page.getByRole("switch", { name: "High scores" });
  await expect(nameField).toBeVisible();

  await page.getByRole("button", { name: "Settings" }).click();
  await highScoresSwitch.click();
  await page.keyboard.press("Escape");

  await expect(nameField).toBeHidden();
  await expect(page.getByRole("button", { name: "New game" })).toBeVisible();

  // The same win can still be saved once the switch is back on.
  await page.getByRole("button", { name: "Settings" }).click();
  await highScoresSwitch.click();
  await page.keyboard.press("Escape");

  await expect(nameField).toBeVisible();
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

test("the bull says something new on each click, then hints mid-game", async ({
  page,
}) => {
  await page.goto("/");
  const bull = page.getByRole("button", { name: "Ask Tyr" });
  const bubble = page.getByRole("dialog", { name: "Tyr says" });

  await bull.click();
  await expect(bubble).toBeVisible();
  const firstLine = await bubble.innerText();

  // A second click keeps the bubble open with a different line.
  await bull.click();
  await expect(bubble).toBeVisible();
  await expect(bubble).not.toHaveText(firstLine);

  await page.keyboard.press("Escape");
  await expect(bubble).toBeHidden();

  // Colours every difficulty shares; auto check (0008) scores the row.
  for (const color of ["red", "cyan", "green", "yellow"]) {
    await page.getByRole("button", { name: `Add ${color}` }).click();
  }
  await expect(
    page.getByLabel("Board").getByText(/bulls?, \d+ cows?|No matches/),
  ).toBeAttached();

  // After a guess, Tyr deduces from the clues or says there aren't enough.
  await bull.click();
  await expect(bubble).toHaveText(
    /^No \S+ in the code|^The code has|^Slot \d|still fits? your clues|^Only one code fits|^Your row has|^No colour appears twice|not enough clues yet/,
  );
});

test("light mode lightens the app but not the board", async ({ page }) => {
  await page.goto("/");
  const body = page.locator("body");
  const board = page.getByLabel("Board");
  expect(await getBackgroundLightness(body)).toBeLessThan(0.5);
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
  await expect.poll(() => getBackgroundLightness(body)).toBeGreaterThan(0.5);
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
  await expect
    .poll(() => getBackgroundLightness(page.locator("body")))
    .toBeGreaterThan(0.5);
});
