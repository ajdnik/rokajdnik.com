import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("has correct page title", async ({ page }) => {
    await expect(page).toHaveTitle("Rok Ajdnik");
  });

  test("displays the profile image", async ({ page }) => {
    const profileImage = page.locator(".profile-image img");
    await expect(profileImage).toBeVisible();
    await expect(profileImage).toHaveAttribute("alt", "Rok Ajdnik");
  });

  test("displays the introduction text", async ({ page }) => {
    const intro = page.locator(".paragraph");
    await expect(intro).toBeVisible();
    await expect(intro).toContainText("Rok Ajdnik");
    await expect(intro).toContainText("software engineer");
  });

  test("displays GitHub and LinkedIn buttons", async ({ page }) => {
    const github = page.locator('a[href="https://github.com/ajdnik"]').first();
    const linkedin = page
      .locator('a[href="https://linkedin.com/in/rokajdnik"]')
      .first();
    await expect(github).toBeVisible();
    await expect(linkedin).toBeVisible();
  });

  test("displays Featured section with posts", async ({ page }) => {
    const sectionHeading = page.getByText("F E A T U R E D");
    await expect(sectionHeading).toBeVisible();

    const featureCards = page.locator("section .space-y-3 > a");
    await expect(featureCards).not.toHaveCount(0);
  });

  test("featured cards have required elements", async ({ page }) => {
    const firstCard = page.locator("section .space-y-3 > a").first();
    await expect(firstCard).toBeVisible();

    // Each card should have a title, date, and tags
    await expect(firstCard.locator("h3")).toBeVisible();
    await expect(firstCard.locator("h3")).not.toHaveText("");
  });

  test("featured card links to a blog post", async ({ page }) => {
    const firstCard = page.locator("section .space-y-3 > a").first();
    const href = await firstCard.getAttribute("href");
    expect(href).toBeTruthy();
    expect(href).toMatch(/^\//);
  });
});
