import { test, expect } from "@playwright/test";

test.describe("Archive page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/archive/1");
  });

  test("displays year filter buttons", async ({ page }) => {
    const yearButtons = page.locator('a.button[href^="/archive/"]').filter({ hasText: /\d{4}/ });
    await expect(yearButtons).not.toHaveCount(0);
  });

  test("displays blog post cards", async ({ page }) => {
    const postCards = page.locator(".space-y-1 > a");
    await expect(postCards).not.toHaveCount(0);
  });

  test("post cards have title and date", async ({ page }) => {
    const firstCard = page.locator(".space-y-1 > a").first();
    await expect(firstCard.locator("h3")).toBeVisible();
    await expect(firstCard.locator("h3")).not.toHaveText("");
  });

  test("post cards link to blog posts", async ({ page }) => {
    const firstCard = page.locator(".space-y-1 > a").first();
    const href = await firstCard.getAttribute("href");
    expect(href).toBeTruthy();
    expect(href).toMatch(/^\//);
  });

  test("displays pagination", async ({ page }) => {
    const pagination = page.locator("nav").filter({ hasText: /of/ });
    await expect(pagination).toBeVisible();
  });

  test("clicking a year filters posts", async ({ page }) => {
    const yearButton = page.locator('a.button[href^="/archive/"]').filter({ hasText: /\d{4}/ }).first();
    const href = await yearButton.getAttribute("href");
    await yearButton.click();

    await expect(page).toHaveURL(href!);
  });
});

test.describe("Archive year page", () => {
  test("displays posts filtered by year", async ({ page }) => {
    // Navigate to archive first to get a valid year link
    await page.goto("/archive/1");
    const yearButton = page.locator('a.button[href^="/archive/"]').filter({ hasText: /\d{4}/ }).first();
    const yearText = (await yearButton.textContent())?.trim();
    const href = await yearButton.getAttribute("href");

    await page.goto(href!);

    await expect(page).toHaveTitle(`Archive ${yearText} | Rok Ajdnik`);

    const heading = page.locator("h1.heading");
    await expect(heading).toHaveText("Archive");

    const postCards = page.locator(".space-y-1 > a");
    await expect(postCards).not.toHaveCount(0);
  });
});
