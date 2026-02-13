import { test, expect } from "@playwright/test";

test.describe("404 page", () => {
  test("displays 404 content", async ({ page }) => {
    await page.goto("/404");

    await expect(page).toHaveTitle("404 | Not Found");

    const heading = page.locator("h1.heading");
    await expect(heading).toHaveText("404");

    await expect(page.locator("section.center")).toContainText(
      "The page you requested cannot be found",
    );
  });

  test("has a link back to homepage", async ({ page }) => {
    await page.goto("/404");

    const homeLink = page.locator('a.button', { hasText: "Go Home" });
    await expect(homeLink).toBeVisible();
    await expect(homeLink).toHaveAttribute("href", "/");
  });

  test("clicking Go Home navigates to homepage", async ({ page }) => {
    await page.goto("/404");

    await page.locator('a.button', { hasText: "Go Home" }).click();
    await expect(page).toHaveURL("/");
  });
});
