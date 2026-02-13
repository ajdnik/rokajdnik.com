import { test, expect } from "@playwright/test";

test.describe("Back to top button", () => {
  test("is hidden when at the top of the page", async ({ page }) => {
    await page.goto("/fizzbuzz-madness-in-javascript");

    const backToTop = page.locator('button[aria-label="Back to top"]');
    await expect(backToTop).toHaveClass(/opacity-0/);
  });

  test("appears after scrolling down", async ({ page }) => {
    await page.goto("/fizzbuzz-madness-in-javascript");

    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(300);

    const backToTop = page.locator('button[aria-label="Back to top"]');
    await expect(backToTop).toHaveClass(/opacity-100/);
  });

  test("scrolls back to top when clicked", async ({ page }) => {
    await page.goto("/fizzbuzz-madness-in-javascript");

    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(300);

    const backToTop = page.locator('button[aria-label="Back to top"]');
    await backToTop.click();

    await page.waitForFunction(() => window.scrollY < 100);
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeLessThan(100);
  });
});

test.describe("Progress bar", () => {
  test("is visible on blog posts", async ({ page }) => {
    await page.goto("/fizzbuzz-madness-in-javascript");

    const progressBar = page.locator(".bg-foreground\\/13.fixed.top-0");
    await expect(progressBar).toBeVisible();
  });

  test("width increases on scroll", async ({ page }) => {
    await page.goto("/fizzbuzz-madness-in-javascript");

    const progressFill = page.locator(
      ".bg-foreground\\/13.fixed.top-0 > div",
    );

    // Initially at top, width should be small
    const initialWidth = await progressFill.evaluate(
      (el) => parseFloat(el.style.width) || 0,
    );

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    const scrolledWidth = await progressFill.evaluate(
      (el) => parseFloat(el.style.width) || 0,
    );

    expect(scrolledWidth).toBeGreaterThan(initialWidth);
  });
});

test.describe("Lightbox", () => {
  test("lightbox is hidden by default", async ({ page }) => {
    await page.goto("/fizzbuzz-madness-in-javascript");

    const lightbox = page.locator("#lightbox");
    await expect(lightbox).not.toHaveClass(/active/);
  });

  test("clicking a markdown image opens the lightbox", async ({ page }) => {
    await page.goto("/zork-the-great-underground-empire");

    // Scroll to find an image in the markdown content
    const markdownImg = page.locator(".markdown img").first();
    await markdownImg.scrollIntoViewIfNeeded();
    await markdownImg.click();

    const lightbox = page.locator("#lightbox");
    await expect(lightbox).toHaveClass(/active/);

    const lightboxImg = page.locator("#lightbox-img");
    await expect(lightboxImg).toBeVisible();
    const src = await lightboxImg.getAttribute("src");
    expect(src).toBeTruthy();
  });

  test("clicking close button closes the lightbox", async ({ page }) => {
    await page.goto("/zork-the-great-underground-empire");

    const markdownImg = page.locator(".markdown img").first();
    await markdownImg.scrollIntoViewIfNeeded();
    await markdownImg.click();

    const lightbox = page.locator("#lightbox");
    await expect(lightbox).toHaveClass(/active/);

    await page.locator("#lightbox-close").click();
    await expect(lightbox).not.toHaveClass(/active/);
  });

  test("pressing Escape closes the lightbox", async ({ page }) => {
    await page.goto("/zork-the-great-underground-empire");

    const markdownImg = page.locator(".markdown img").first();
    await markdownImg.scrollIntoViewIfNeeded();
    await markdownImg.click();

    const lightbox = page.locator("#lightbox");
    await expect(lightbox).toHaveClass(/active/);

    await page.keyboard.press("Escape");
    await expect(lightbox).not.toHaveClass(/active/);
  });
});
