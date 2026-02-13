import { test, expect } from "@playwright/test";

test.describe("Tags index page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tags");
  });

  test("has correct page title", async ({ page }) => {
    await expect(page).toHaveTitle("Tags | Rok Ajdnik");
  });

  test("displays tag buttons", async ({ page }) => {
    const tagButtons = page.locator("section .button");
    await expect(tagButtons).not.toHaveCount(0);
  });

  test("tag buttons link to tag filter pages", async ({ page }) => {
    const firstTag = page.locator("section .button").first();
    const href = await firstTag.getAttribute("href");
    expect(href).toMatch(/^\/tags\/.+\/1$/);
  });

  test("clicking a tag navigates to filtered posts", async ({ page }) => {
    const firstTag = page.locator("section .button").first();
    const tagText = (await firstTag.textContent())?.trim();
    await firstTag.click();

    await expect(page).toHaveURL(new RegExp(`/tags/${tagText}/1`));
  });
});

test.describe("Tag filter page", () => {
  test("displays posts filtered by tag", async ({ page }) => {
    // Navigate to tags page first to get a valid tag
    await page.goto("/tags");
    const firstTag = page.locator("section .button").first();
    const tagText = (await firstTag.textContent())?.trim();
    await firstTag.click();

    // Should show the tag as heading
    const heading = page.locator("h1.heading");
    await expect(heading).toHaveText(tagText!);

    // Should show post cards
    const postCards = page.locator(".space-y-1 > a");
    await expect(postCards).not.toHaveCount(0);
  });

  test("all displayed posts have the filtered tag", async ({ page }) => {
    await page.goto("/tags");
    const firstTag = page.locator("section .button").first();
    const tagText = (await firstTag.textContent())?.trim();
    await firstTag.click();

    const postCards = page.locator(".space-y-1 > a");
    const count = await postCards.count();

    for (let i = 0; i < count; i++) {
      const card = postCards.nth(i);
      const tags = card.locator("span.rounded-lg");
      const tagTexts = await tags.allTextContents();
      const trimmed = tagTexts.map((t) => t.trim());
      expect(trimmed).toContain(tagText);
    }
  });
});
