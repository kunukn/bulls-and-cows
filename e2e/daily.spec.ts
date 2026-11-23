import { expect, test, type Page } from "@playwright/test";

/* Midday, so the calendar date is the same in whatever zone the run uses. */
const DAY = new Date(2026, 11, 10, 12);
const JUST_AFTER_MIDNIGHT = new Date(2026, 11, 11, 0, 0, 5);

async function openDaily(page: Page) {
  await page.goto("/");
  await page.getByRole("link", { name: "Daily code" }).click();
  await expect(page).toHaveURL((url) => url.pathname === "/daily");
}

/* "Daily code #18" → 18 */
async function readDailyNumber(page: Page): Promise<number> {
  const heading = page.getByRole("heading", { name: "Daily code" });
  const [, number] = /#(\d+)/.exec(await heading.innerText()) ?? [];

  return Number(number);
}

async function winDaily(page: Page) {
  // The game is saved on its first event; the save holds the day's code.
  await page.getByRole("button", { name: /^Add / }).first().click();
  const secret = await page.evaluate<string[]>(
    () =>
      JSON.parse(localStorage.getItem("app:daily-game") ?? "{}").context.secret,
  );
  await page.getByRole("button", { name: "Undo" }).click();

  for (const color of secret) {
    await page.getByRole("button", { name: `Add ${color}` }).click();
  }
  await page.getByRole("button", { name: "Check" }).click();
}

test("the daily code gets one attempt and leaves practice alone", async ({
  page,
}) => {
  await page.clock.setFixedTime(DAY);
  // A practice game under way, to check the daily game doesn't replace it.
  await page.goto("/");
  await page.getByRole("button", { name: /^Add / }).first().click();
  const practiceSlot = page.getByRole("button", { name: /^Slot 1/ }).first();
  const practiceRow = await practiceSlot.getAttribute("aria-label");

  await openDaily(page);
  const hiddenCode = page.getByLabel("Secret code (hidden)");
  const newGame = page.getByRole("menuitem", { name: "New game" });
  await expect(hiddenCode).toBeVisible();

  // No restart while playing (0012): the menu only reveals the code.
  await page.getByRole("button", { name: "Give up" }).click();
  await expect(
    page.getByRole("menuitem", { name: "Reveal code" }),
  ).toBeVisible();
  await expect(newGame).toBeHidden();
  await page.keyboard.press("Escape");

  await winDaily(page);
  const outcome = page.getByText(/Cracked in 1 guess/);
  await expect(outcome).toBeVisible();
  await expect(page.getByText(/Next code in/)).toBeVisible();
  // No second attempt once it's over either, and no high-score prompt.
  await expect(page.getByRole("button", { name: "New game" })).toBeHidden();
  await expect(page.getByRole("textbox", { name: "Your name" })).toBeHidden();

  // The finished board is still there after a reload.
  await page.reload();
  await expect(outcome).toBeVisible();
  await expect(hiddenCode).toBeHidden();

  await page.getByRole("link", { name: "Practice game" }).click();
  await expect(page.getByRole("link", { name: "Daily code" })).toContainText(
    "Solved",
  );
  await expect(hiddenCode).toBeVisible();
  await expect(practiceSlot).toHaveAccessibleName(practiceRow ?? "");
});

test("share copies the result without the code", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  // Take the clipboard path: whether a headless browser has a share sheet varies.
  await page.addInitScript(() => {
    Reflect.deleteProperty(Navigator.prototype, "share");
  });
  await page.clock.setFixedTime(DAY);
  await openDaily(page);
  const number = await readDailyNumber(page);
  await winDaily(page);

  await page.getByRole("button", { name: "Share" }).click();
  await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();

  const text = await page.evaluate(() => navigator.clipboard.readText());
  // A win on the first guess: one line, every peg a bull (Classic: 4 of 10).
  expect(text).toBe(
    [
      `Tyr & Ko · Daily code #${number} · 1/10`,
      "",
      "⚫⚫⚫⚫",
      "",
      new URL("/daily", page.url()).href,
    ].join("\n"),
  );
});

test("a new day brings a new code and the streak carries on", async ({
  page,
}) => {
  await page.clock.setFixedTime(DAY);
  await openDaily(page);
  const firstNumber = await readDailyNumber(page);
  await winDaily(page);
  // Label then number, the order a screen reader meets them in.
  const stats = page.getByRole("main");
  await expect(stats).toContainText(/Streak\s*1/);

  // Midnight passes with the finished board still on screen.
  await page.clock.setFixedTime(JUST_AFTER_MIDNIGHT);
  await page.getByRole("button", { name: "Play today's code" }).click();

  await expect(page.getByLabel("Secret code (hidden)")).toBeVisible();
  expect(await readDailyNumber(page)).toBe(firstNumber + 1);

  await winDaily(page);
  await expect(stats).toContainText(/Streak\s*2/);
  await expect(stats).toContainText(/Played\s*2/);
});

test("the Daily code switch hides the way in but keeps the page", async ({
  page,
}) => {
  await page.goto("/");
  const dailyLink = page.getByRole("link", { name: "Daily code" });
  await expect(dailyLink).toBeVisible();

  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("switch", { name: "Daily code" }).click();
  await page.keyboard.press("Escape");

  await expect(dailyLink).toBeHidden();
  await page.getByRole("button", { name: "How it works" }).click();
  await expect(page.getByRole("heading", { name: "Daily code" })).toBeHidden();

  // A shared link still opens the day's code.
  await page.goto("/daily");
  await expect(page.getByRole("heading", { name: /Daily code/ })).toBeVisible();
});
