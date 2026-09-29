import { test, expect, type Page } from "@playwright/test";

const CONSENT_KEY = "privacy-consent";

function seedConsent(page: Page, analytics: "granted" | "denied") {
  return page.addInitScript(
    ([key, value]) => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(
          key,
          JSON.stringify({ version: 1, analytics: value, updatedAt: "" }),
        );
      }
    },
    [CONSENT_KEY, analytics],
  );
}

async function storedConsent(page: Page) {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "null")?.analytics,
    CONSENT_KEY,
  );
}

test.describe("Analytics", () => {
  let analyticsRequests: string[];

  test.beforeEach(async ({ page }) => {
    analyticsRequests = [];
    await page.route("https://tm.rokajdnik.com/**", (route) => {
      analyticsRequests.push(route.request().url());
      return route.abort();
    });
  });

  test("does not initialize PostHog before consent", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#consent-card")).toBeVisible();
    await page.waitForTimeout(500);

    expect(await page.evaluate(() => "posthog" in window)).toBe(false);
    expect(analyticsRequests).toEqual([]);
  });

  test("granting consent initializes PostHog", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto("/");
    await page.locator("#consent-card").click();

    const dialog = page.getByRole("dialog", { name: "Privacy settings" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Accept" }).click();

    await expect(dialog).toBeHidden();
    await expect(page.locator("#consent-card")).toBeHidden();
    await page.waitForFunction(() => "posthog" in window);
    expect(await storedConsent(page)).toBe("granted");
    expect(errors).toEqual([]);
  });

  test("rejecting consent keeps analytics disabled", async ({ page }) => {
    await page.goto("/");
    await page.locator("#consent-card").click();

    const dialog = page.getByRole("dialog", { name: "Privacy settings" });
    await dialog.getByRole("button", { name: "Reject" }).click();

    await expect(dialog).toBeHidden();
    await expect(page.locator("#consent-card")).toBeHidden();
    expect(await storedConsent(page)).toBe("denied");

    await page.reload();
    await page.waitForTimeout(500);
    await expect(page.locator("#consent-card")).toBeHidden();
    expect(await page.evaluate(() => "posthog" in window)).toBe(false);
    expect(analyticsRequests).toEqual([]);
  });

  test("closing the dialog without choosing keeps analytics disabled", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator("#consent-card").click();

    const dialog = page.getByRole("dialog", { name: "Privacy settings" });
    await page.keyboard.press("Escape");

    await expect(dialog).toBeHidden();
    await expect(page.locator("#consent-card")).toBeVisible();
    expect(await storedConsent(page)).toBeUndefined();
    expect(await page.evaluate(() => "posthog" in window)).toBe(false);
  });

  test("consent persists across navigation and reload", async ({ page }) => {
    await page.goto("/");
    await page.locator("#consent-card").click();
    await page
      .getByRole("dialog", { name: "Privacy settings" })
      .getByRole("button", { name: "Accept" })
      .click();

    await page.locator('header a[href="/tags"]').click();
    await expect(page).toHaveURL("/tags");
    await expect(page.locator("#consent-card")).toBeHidden();
    await page.waitForFunction(() => "posthog" in window);

    await page.reload();
    await expect(page.locator("#consent-card")).toBeHidden();
    await page.waitForFunction(() => "posthog" in window);
  });

  test("initializes PostHog without requestIdleCallback", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    await seedConsent(page, "granted");
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

  test("privacy settings can be reopened to withdraw consent", async ({
    page,
  }) => {
    await seedConsent(page, "granted");
    await page.goto("/");
    await page.waitForFunction(() => "posthog" in window);
    await page.evaluate(() => {
      localStorage.setItem("ph_test_posthog", "{}");
      sessionStorage.setItem("ph_test_window_id", "x");
      document.cookie = "ph_test_posthog=1; path=/";
    });

    await page.getByRole("button", { name: "Privacy settings" }).click();
    const dialog = page.getByRole("dialog", { name: "Privacy settings" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Analytics: On")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Accept" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await dialog.getByRole("button", { name: "Reject" }).click();
    await expect(dialog).toBeHidden();
    expect(await storedConsent(page)).toBe("denied");

    const state = await page.evaluate(() => ({
      local: localStorage.getItem("ph_test_posthog"),
      session: sessionStorage.getItem("ph_test_window_id"),
      cookie: document.cookie.includes("ph_test_posthog"),
      // Calls queued on the PostHog stub before the library loads.
      calls: (window.posthog as unknown[])
        .filter(Array.isArray)
        .map((call) => call[0]),
    }));
    expect(state.local).toBeNull();
    expect(state.session).toBeNull();
    expect(state.cookie).toBe(false);
    expect(state.calls).toEqual(
      expect.arrayContaining(["opt_out_capturing", "reset"]),
    );

    await page.reload();
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => "posthog" in window)).toBe(false);
  });

  test.describe("mobile viewport", () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test("shows a compact card that opens the dialog", async ({ page }) => {
      await page.goto("/");

      const card = page.locator("#consent-card");
      await expect(card).toBeVisible();
      await expect(card.getByText("Privacy choices")).toBeHidden();
      const box = (await card.boundingBox())!;
      expect(box.width).toBeLessThanOrEqual(48);
      expect(box.height).toBeLessThanOrEqual(48);

      await card.click();
      const dialog = page.getByRole("dialog", { name: "Privacy settings" });
      await expect(dialog).toBeVisible();
      const dialogBox = (await dialog.boundingBox())!;
      expect(dialogBox.x).toBeGreaterThanOrEqual(0);
      expect(dialogBox.x + dialogBox.width).toBeLessThanOrEqual(375);

      const reject = await dialog
        .getByRole("button", { name: "Reject" })
        .boundingBox();
      const accept = await dialog
        .getByRole("button", { name: "Accept" })
        .boundingBox();
      expect(reject!.width).toBeCloseTo(accept!.width, 0);
      expect(reject!.height).toBeCloseTo(accept!.height, 0);
    });
  });
});
