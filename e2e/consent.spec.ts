import { test, expect } from "@playwright/test";

test.describe("Privacy consent UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("https://tm.rokajdnik.com/**", (route) => route.abort());
  });

  test("shows the consent card until a choice is made", async ({ page }) => {
    await page.goto("/");

    const card = page.getByRole("button", { name: "Privacy choices" });
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute("aria-haspopup", "dialog");

    await card.click();
    const dialog = page.getByRole("dialog", { name: "Privacy settings" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("PostHog analytics");
    await expect(dialog).toContainText("Not set");
    await expect(dialog.getByRole("button", { name: "Accept" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Reject" })).toBeVisible();

    await dialog.getByRole("button", { name: "Reject" }).click();
    await expect(dialog).toBeHidden();
    await expect(card).toBeHidden();

    await page.goto("/tags");
    await expect(page.locator("#consent-card")).toBeHidden();
  });

  test("closing the dialog without choosing keeps consent unset", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Privacy choices" }).click();
    const dialog = page.getByRole("dialog", { name: "Privacy settings" });
    await expect(dialog).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    await page.getByRole("button", { name: "Privacy choices" }).click();
    await dialog.getByRole("button", { name: "Close privacy settings" }).click();
    await expect(dialog).toBeHidden();

    await expect(
      page.getByRole("button", { name: "Privacy choices" }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => localStorage.getItem("privacy-consent")),
    ).toBeNull();
  });

  test("dialog is keyboard accessible", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Privacy choices" }).focus();
    await page.keyboard.press("Enter");

    const dialog = page.getByRole("dialog", { name: "Privacy settings" });
    await expect(dialog).toBeVisible();
    // Focus moves into the modal dialog.
    expect(
      await page.evaluate(
        () => !!document.activeElement?.closest("#consent-dialog"),
      ),
    ).toBe(true);

    await dialog.getByRole("button", { name: "Accept" }).focus();
    await page.keyboard.press("Enter");
    await expect(dialog).toBeHidden();
  });

  test("privacy settings can be reopened from the footer", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Privacy choices" }).click();
    await page.getByRole("button", { name: "Accept" }).click();

    await page.reload();
    await page
      .getByRole("contentinfo")
      .getByRole("button", { name: "Privacy settings" })
      .click();

    const dialog = page.getByRole("dialog", { name: "Privacy settings" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Analytics accepted");
    await expect(dialog.getByRole("button", { name: "Accept" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(dialog.getByRole("button", { name: "Reject" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  test.describe("on mobile viewports", () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test("shows a compact card that opens a dialog fitting the screen", async ({
      page,
    }) => {
      await page.goto("/");

      const card = page.locator("#consent-card");
      await expect(card).toBeVisible();
      await expect(card).toHaveAccessibleName("Privacy");
      await expect(card.getByText("Analytics is off")).toBeHidden();

      const box = (await card.boundingBox())!;
      expect(box.width).toBeLessThan(140);
      expect(box.height).toBeLessThan(44);
      expect(box.y + box.height).toBeLessThanOrEqual(667);

      await card.click();
      const dialog = page.getByRole("dialog", { name: "Privacy settings" });
      await expect(dialog).toBeVisible();
      const dialogBox = (await dialog.boundingBox())!;
      expect(dialogBox.x).toBeGreaterThanOrEqual(0);
      expect(dialogBox.x + dialogBox.width).toBeLessThanOrEqual(375);
      await expect(dialog.getByRole("button", { name: "Accept" })).toBeInViewport();
      await expect(dialog.getByRole("button", { name: "Reject" })).toBeInViewport();

      await dialog.getByRole("button", { name: "Reject" }).click();
      await expect(card).toBeHidden();
    });
  });
});
