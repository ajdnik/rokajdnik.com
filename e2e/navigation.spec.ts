import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("header shows site name linking to home", async ({ page }) => {
    const homeLink = page.locator('header a[href="/"]');
    await expect(homeLink).toBeVisible();
    await expect(homeLink).toHaveText("Rok Ajdnik");
  });

  test("header has navigation links", async ({ page }) => {
    await expect(page.locator('header a[href="/cv"]')).toBeVisible();
    await expect(page.locator('header a[href="/archive/1"]')).toBeVisible();
    await expect(page.locator('header a[href="/tags"]')).toBeVisible();
  });

  test("header has RSS feed link", async ({ page }) => {
    const rssLink = page.locator('header a[href="/rss.xml"]');
    await expect(rssLink).toBeVisible();
    await expect(rssLink).toHaveAttribute("target", "_blank");
  });

  test("header has theme toggle button", async ({ page }) => {
    const toggle = page.locator('header button[aria-label="toggle theme"]');
    await expect(toggle).toBeVisible();
  });

  test("navigating to archive works", async ({ page }) => {
    await page.locator('header a[href="/archive/1"]').click();
    await expect(page).toHaveURL("/archive/1");
  });

  test("navigating to tags works", async ({ page }) => {
    await page.locator('header a[href="/tags"]').click();
    await expect(page).toHaveURL("/tags");
  });

  test("navigating to CV works", async ({ page }) => {
    await page.locator('header a[href="/cv"]').click();
    await expect(page).toHaveURL("/cv");
  });

  test("clicking site name navigates to home", async ({ page }) => {
    await page.goto("/cv");
    await page.locator('header a[href="/"]').click();
    await expect(page).toHaveURL("/");
  });

  test("footer is visible with copyright", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    await expect(footer).toContainText("MIT License");
  });

  test("footer has social links", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(
      footer.locator('a[href="https://github.com/ajdnik"]'),
    ).toBeVisible();
    await expect(
      footer.locator('a[href="https://linkedin.com/in/rokajdnik"]'),
    ).toBeVisible();
    await expect(
      footer.locator('a[href="mailto:hi@rokajdnik.com?subject=Hello"]'),
    ).toBeVisible();
  });
});
