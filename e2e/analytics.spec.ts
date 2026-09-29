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

  test("privacy copy spaces the PostHog link and footer settings open the dialog", async ({
    page,
  }) => {
    await seedConsent(page, "denied");
    await page.goto("/");

    const footer = page.locator("footer");
    const attribution = footer.getByText("powered by Astro");
    const settings = footer.getByRole("button", { name: "Privacy settings" });
    await expect(settings).toHaveAttribute("aria-haspopup", "dialog");
    await expect(settings).toHaveAttribute("aria-controls", "privacy-dialog");
    await expect(settings).toHaveCSS("cursor", "pointer");
    await expect(settings).toHaveCSS("text-decoration-line", "underline");

    const attributionBox = (await attribution.boundingBox())!;
    const settingsBox = (await settings.boundingBox())!;
    expect(Math.abs(attributionBox.y - settingsBox.y)).toBeLessThan(10);

    await settings.click();
    const dialog = page.getByRole("dialog", { name: "Privacy settings" });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.locator("#privacy-dialog-description p").first(),
    ).toContainText(/uses\s+PostHog\s+analytics/);
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
      // The library never loaded, so the pending stub is discarded.
      posthog: "posthog" in window,
    }));
    expect(state.local).toBeNull();
    expect(state.session).toBeNull();
    expect(state.cookie).toBe(false);
    expect(state.posthog).toBe(false);

    await page.reload();
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => "posthog" in window)).toBe(false);
  });

  test("withdrawing consent opts out and resets a loaded PostHog client", async ({
    page,
  }) => {
    // Stand-in for the PostHog library that records the calls it receives.
    await page.route("https://tm.rokajdnik.com/static/array.js", (route) =>
      route.fulfill({
        contentType: "text/javascript",
        body: `(function () {
          var calls = [];
          var ph = { __loaded: true, calls: calls };
          ["init", "opt_out_capturing", "opt_in_capturing", "reset", "set_config"]
            .forEach(function (m) { ph[m] = function () { calls.push(m); }; });
          window.posthog = ph;
        })();`,
      }),
    );
    await seedConsent(page, "granted");
    await page.goto("/");
    await page.waitForFunction(() => window.posthog?.__loaded === true);

    const choose = async (name: "Accept" | "Reject") => {
      await page.getByRole("button", { name: "Privacy settings" }).click();
      await page
        .getByRole("dialog", { name: "Privacy settings" })
        .getByRole("button", { name })
        .click();
    };

    await choose("Reject");
    expect(await page.evaluate(() => window.posthog.calls)).toEqual([
      "opt_out_capturing",
      "set_config",
      "reset",
    ]);

    await choose("Accept");
    expect(await page.evaluate(() => window.posthog.calls.slice(3))).toEqual([
      "set_config",
      "opt_in_capturing",
    ]);
  });

  test.describe("mobile viewport", () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test("keeps footer settings inline without overflowing", async ({
      page,
    }) => {
      await seedConsent(page, "denied");
      await page.goto("/");

      const footer = page.locator("footer");
      const attributionBox = (await footer
        .getByText("powered by Astro")
        .boundingBox())!;
      const settingsBox = (await footer
        .getByRole("button", { name: "Privacy settings" })
        .boundingBox())!;
      expect(Math.abs(attributionBox.y - settingsBox.y)).toBeLessThan(10);
      expect(settingsBox.x).toBeGreaterThanOrEqual(0);
      expect(settingsBox.x + settingsBox.width).toBeLessThanOrEqual(375);
    });

    test("shows a compact card that opens the dialog", async ({ page }) => {
      await page.goto("/");

      const card = page.locator("#consent-card");
      await expect(card).toBeVisible();
      await expect(card).toHaveAccessibleName("Privacy choices");
      await expect(
        card.getByText("Analytics is off until you decide."),
      ).toBeHidden();
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
