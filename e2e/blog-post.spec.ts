import { test, expect } from "@playwright/test";

test.describe("Blog post page", () => {
  test("renders a featured blog post", async ({ page }) => {
    await page.goto("/fizzbuzz-madness-in-javascript");

    await expect(page).toHaveTitle("FizzBuzz Madness in JavaScript");
  });

  test("displays the cover image", async ({ page }) => {
    await page.goto("/fizzbuzz-madness-in-javascript");

    const coverImage = page.locator(".cover-image img");
    await expect(coverImage).toBeVisible();
  });

  test("displays blog title in the article header", async ({ page }) => {
    await page.goto("/fizzbuzz-madness-in-javascript");

    const title = page.locator("h1.blog-title");
    await expect(title).toHaveText("FizzBuzz Madness in JavaScript");
  });

  test("displays date and read time", async ({ page }) => {
    await page.goto("/fizzbuzz-madness-in-javascript");

    const header = page.locator("article header");
    await expect(header).toContainText("min read");
    await expect(header).toContainText("2026");
  });

  test("displays tags that link to tag pages", async ({ page }) => {
    await page.goto("/fizzbuzz-madness-in-javascript");

    const tagLinks = page.locator('article header a[href^="/tags/"]');
    await expect(tagLinks).not.toHaveCount(0);

    const firstTag = tagLinks.first();
    const href = await firstTag.getAttribute("href");
    expect(href).toMatch(/^\/tags\/.+\/1$/);
  });

  test("displays markdown content", async ({ page }) => {
    await page.goto("/fizzbuzz-madness-in-javascript");

    const markdown = page.locator("section.markdown");
    await expect(markdown).toBeVisible();

    // Should have headings
    const h2s = markdown.locator("h2");
    await expect(h2s).not.toHaveCount(0);
  });

  test("code blocks have line numbers", async ({ page }) => {
    await page.goto("/fizzbuzz-madness-in-javascript");

    const codeBlock = page.locator(".astro-code").first();
    await expect(codeBlock).toBeVisible();

    // Line numbers are rendered via CSS counters on .line::before
    const lines = codeBlock.locator(".line");
    await expect(lines).not.toHaveCount(0);
  });

  test("progress bar is present", async ({ page }) => {
    await page.goto("/fizzbuzz-madness-in-javascript");

    const progressBar = page.locator(".bg-foreground\\/13.fixed.top-0");
    await expect(progressBar).toBeVisible();
  });
});

test.describe("Blog post with series", () => {
  test("displays series navigation on first article", async ({ page }) => {
    await page.goto("/zork-the-great-underground-empire");

    const seriesNav = page.locator("section", {
      hasText: "Part 1 of 2",
    });
    await expect(seriesNav).toBeVisible();
    await expect(seriesNav).toContainText("Series");
  });

  test("series nav shows 'Next article' on first post", async ({ page }) => {
    await page.goto("/zork-the-great-underground-empire");

    const nextLink = page.locator('a', { hasText: "Next article" });
    await expect(nextLink).toBeVisible();
    await expect(nextLink).toHaveAttribute(
      "href",
      "/zork-the-great-inner-workings",
    );
  });

  test("series nav shows 'First article' on second post", async ({
    page,
  }) => {
    await page.goto("/zork-the-great-inner-workings");

    const firstLink = page.locator('a', { hasText: "First article" });
    await expect(firstLink).toBeVisible();
    await expect(firstLink).toHaveAttribute(
      "href",
      "/zork-the-great-underground-empire",
    );
  });

  test("navigating between series posts works", async ({ page }) => {
    await page.goto("/zork-the-great-underground-empire");

    await page.locator('a', { hasText: "Next article" }).click();
    await expect(page).toHaveURL("/zork-the-great-inner-workings");
    await expect(page.locator("h1.blog-title")).toContainText(
      "Zork: The Great Inner Workings",
    );
  });
});

test.describe("Blog post without line numbers", () => {
  test("disables line numbers when configured", async ({ page }) => {
    await page.goto("/zork-the-great-inner-workings");

    const markdown = page.locator("section.markdown");
    await expect(markdown).toHaveClass(/no-line-numbers/);
  });
});

test.describe("Blog post cover caption", () => {
  test("displays cover caption when present", async ({ page }) => {
    await page.goto("/fizzbuzz-madness-in-javascript");

    const caption = page.locator(".cover-image figcaption");
    await expect(caption).toBeVisible();
    await expect(caption).not.toHaveText("");
  });
});
