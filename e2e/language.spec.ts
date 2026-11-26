import { expect, test } from "@playwright/test";

/*
 * Every language but English is fetched on demand (src/i18n/index.ts). The
 * page must wait for it instead of painting in English first.
 */
test("a returning player never sees English before their own language", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("app:language", JSON.stringify("da")),
  );

  // Hold the Danish strings back, as a slow connection would.
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const danishStrings = /\/da(\.json|-[\w-]+\.js)/;
  await page.route(danishStrings, async (route) => {
    await held;
    await route.continue();
  });

  const request = page.waitForRequest(danishStrings);
  await page.goto("/");
  await request;

  // The app has started and is waiting: nothing is on the page in any language.
  await expect(page.getByRole("button")).toHaveCount(0);
  await expect(page.getByRole("heading")).toHaveCount(0);

  release();

  await expect(page.getByRole("button", { name: "Tjek" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Check" })).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("lang", "da");
});
