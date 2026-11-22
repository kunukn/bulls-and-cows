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

  // Auto check is off by default (0008): a full row waits for Check.
  for (const color of ["red", "cyan", "green", "yellow"]) {
    await page.getByRole("button", { name: `Add ${color}` }).click();
  }
  // Screen-reader summary of the scored row, e.g. "1 bull, 2 cows".
  const rowSummary = page
    .getByLabel("Board")
    .getByText(/bulls?, \d+ cows?|No matches/);
  await expect(checkButton).toBeEnabled();
  await expect(rowSummary).toHaveCount(0);

  await checkButton.click();
  await expect(rowSummary).toBeAttached();
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

  for (const color of secret) {
    await page.getByRole("button", { name: `Add ${color}` }).click();
  }
  await page.getByRole("button", { name: "Check" }).click();

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

/* Lines only the hint bull says after a guess: a deduction, or "not enough clues". */
const HINT_LINE =
  /in the code|^The code has|^Slot \d|^Look for|appears (twice|more than once)|your clues?|^Your row|^Only one code|not enough clues/;

test("the header bull chats and the shield bull helps with the game", async ({
  page,
}) => {
  await page.goto("/");
  const headerBull = page.getByRole("button", { name: "Ask Tyr" });
  const bubble = page.getByRole("dialog", { name: "Tyr says" });

  await headerBull.click();
  await expect(bubble).toBeVisible();
  const firstLine = await bubble.innerText();

  // A second click keeps the bubble open with a different line.
  await headerBull.click();
  await expect(bubble).toBeVisible();
  await expect(bubble).not.toHaveText(firstLine);

  await page.keyboard.press("Escape");
  await expect(bubble).toBeHidden();

  // Colours every difficulty shares.
  for (const color of ["red", "cyan", "green", "yellow"]) {
    await page.getByRole("button", { name: `Add ${color}` }).click();
  }
  await page.getByRole("button", { name: "Check" }).click();
  await expect(
    page.getByLabel("Board").getByText(/bulls?, \d+ cows?|No matches/),
  ).toBeAttached();

  // Mid-game the header bull still only chats: hints are the shield bull's job.
  for (let click = 0; click < 5; click++) {
    await headerBull.click();
    await expect(bubble).not.toHaveText(HINT_LINE);
  }
  await page.keyboard.press("Escape");
  await expect(bubble).toBeHidden();

  await page.getByRole("button", { name: /^(New )?hint$/i }).click();
  await expect(bubble).toHaveText(HINT_LINE);
});

test("the shield bull lights up for a new hint and can be switched off", async ({
  page,
}) => {
  await page.goto("/");
  // The game is saved on its first event; a new game writes one with its secret.
  await page.getByRole("button", { name: "Give up" }).click();
  await page.getByRole("menuitem", { name: "New game" }).click();
  const secret = await page.evaluate<string[]>(
    () => JSON.parse(localStorage.getItem("app:game") ?? "{}").context.secret,
  );
  await expect(page.getByRole("button", { name: "Hint" })).toBeVisible();

  // Easy never repeats, so the code rotated by one is all cows: colours proven.
  for (const color of [...secret.slice(1), secret[0]]) {
    await page.getByRole("button", { name: `Add ${color}` }).click();
  }
  await page.getByRole("button", { name: "Check" }).click();
  const newHint = page.getByRole("button", { name: "New hint" });
  await expect(newHint).toBeVisible();

  // Asking Tyr marks it seen.
  await newHint.click();
  await expect(page.getByRole("dialog", { name: "Tyr says" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Hint" })).toBeVisible();

  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("switch", { name: "Game hints" }).click();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: /^(New )?hint$/i }),
  ).toBeHidden();
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
