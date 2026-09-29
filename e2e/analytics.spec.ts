import { test, expect, type Page } from "@playwright/test";

const CONSENT_KEY = "privacy-consent";

async function presetConsent(page: Page, analytics: "granted" | "denied") {
  await page.addInitScript(
    ([key, value]) => {
      // Only seed once so later changes in the test persist across reloads.
      if (!localStorage.getItem(key)) localStorage.setItem(key, value);
    },
    [
      CONSENT_KEY,
      JSON.stringify({ version: 1, analytics, updatedAt: new Date().toISOString() }),
    ],
  );
}

function trackAnalyticsRequests(page: Page) {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().startsWith("https://tm.rokajdnik.com/")) {
      requests.push(request.url());
    }
  });
  return requests;
}

async function waitForIdle(page: Page) {
  await page.waitForLoadState("networkidle");
  // Give requestIdleCallback/setTimeout-scheduled work a chance to run.
  await page.evaluate(
    () => new Promise((resolve) => setTimeout(resolve, 300)),
  );
}

test.describe("Analytics", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("https://tm.rokajdnik.com/**", (route) => route.abort());
  });

  test("does not initialize PostHog before consent", async ({ page }) => {
    const requests = trackAnalyticsRequests(page);

    await page.goto("/");
    await waitForIdle(page);

    expect(await page.evaluate(() => "posthog" in window)).toBe(false);
    expect(requests).toEqual([]);
  });

  test("initializes PostHog when requestIdleCallback is supported", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await presetConsent(page, "granted");

    await page.goto("/");
    await page.waitForFunction(() => "posthog" in window);

    expect(errors).toEqual([]);
  });

  test("initializes PostHog without requestIdleCallback", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await presetConsent(page, "granted");

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

  test("granting consent initializes PostHog", async ({ page }) => {
    const requests = trackAnalyticsRequests(page);

    await page.goto("/");
    await page.getByRole("button", { name: "Privacy choices" }).click();
    await page
      .getByRole("dialog", { name: "Privacy settings" })
      .getByRole("button", { name: "Accept" })
      .click();

    await page.waitForFunction(() => "posthog" in window);
    await expect.poll(() => requests.length).toBeGreaterThan(0);
  });

  test("rejecting consent keeps PostHog disabled", async ({ page }) => {
    const requests = trackAnalyticsRequests(page);

    await page.goto("/");
    await page.getByRole("button", { name: "Privacy choices" }).click();
    await page
      .getByRole("dialog", { name: "Privacy settings" })
      .getByRole("button", { name: "Reject" })
      .click();
    await waitForIdle(page);

    expect(await page.evaluate(() => "posthog" in window)).toBe(false);

    await page.reload();
    await waitForIdle(page);

    expect(await page.evaluate(() => "posthog" in window)).toBe(false);
    expect(requests).toEqual([]);
  });

  test("consent persists across navigation and reload", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Privacy choices" }).click();
    await page.getByRole("button", { name: "Accept" }).click();

    await page.goto("/cv");
    await page.waitForFunction(() => "posthog" in window);
    await expect(page.locator("#consent-card")).toBeHidden();

    // Existing PostHog identifiers are kept while consent stays granted.
    await page.evaluate(() =>
      localStorage.setItem("ph_phc_test_posthog", '{"distinct_id":"abc"}'),
    );
    await page.reload();
    await page.waitForFunction(() => "posthog" in window);
    await expect(page.locator("#consent-card")).toBeHidden();
    expect(
      await page.evaluate(() => localStorage.getItem("ph_phc_test_posthog")),
    ).not.toBeNull();
  });

  test("withdrawing consent stops tracking and clears PostHog storage", async ({
    page,
    context,
  }) => {
    await presetConsent(page, "granted");
    await page.goto("/");
    await page.waitForFunction(() => "posthog" in window);

    // Simulate identifiers persisted by PostHog.
    await page.evaluate(() => {
      localStorage.setItem("ph_phc_test_posthog", '{"distinct_id":"abc"}');
      sessionStorage.setItem("ph_phc_test_window_id", "xyz");
    });
    await context.addCookies([
      { name: "ph_phc_test_posthog", value: "abc", url: "http://localhost:4321" },
    ]);

    await page.getByRole("button", { name: "Privacy settings" }).click();
    const dialog = page.getByRole("dialog", { name: "Privacy settings" });
    await expect(dialog).toContainText("Analytics accepted");
    await dialog.getByRole("button", { name: "Reject" }).click();
    await expect(dialog).toBeHidden();

    // The PostHog client is told to stop capturing and reset its identity.
    const calls = await page.evaluate(() =>
      Array.from(window.posthog as unknown as unknown[][], (call) => call[0]),
    );
    expect(calls).toEqual(
      expect.arrayContaining(["opt_out_capturing", "reset"]),
    );

    expect(
      await page.evaluate(() => [
        localStorage.getItem("ph_phc_test_posthog"),
        sessionStorage.getItem("ph_phc_test_window_id"),
      ]),
    ).toEqual([null, null]);
    const cookies = await context.cookies();
    expect(cookies.some((c) => c.name.startsWith("ph_"))).toBe(false);

    await page.reload();
    await waitForIdle(page);
    expect(await page.evaluate(() => "posthog" in window)).toBe(false);
  });
});
