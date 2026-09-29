import { test, expect } from "@playwright/test";

test.describe("Analytics", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("https://tm.rokajdnik.com/**", (route) => route.abort());
  });

  test("initializes PostHog when requestIdleCallback is supported", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto("/");
    await page.waitForFunction(() => "posthog" in window);

    expect(errors).toEqual([]);
  });

  test("initializes PostHog without requestIdleCallback", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    await page.addInitScript(() => {
      delete (window as Partial<Window>).requestIdleCallback;
      delete (Window.prototype as Partial<Window>).requestIdleCallback;
    });

    await page.goto("/");
    await page.waitForFunction(() => "posthog" in window);

    expect(await page.evaluate(() => "requestIdleCallback" in window)).toBe(
      false,
    );
    expect(errors).toEqual([]);
  });
});
