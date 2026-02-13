import { test, expect } from "@playwright/test";

test.describe("SEO meta tags", () => {
  test("homepage has required meta tags", async ({ page }) => {
    await page.goto("/");

    // Basic meta
    await expect(page.locator('meta[name="title"]')).toHaveAttribute(
      "content",
      "Rok Ajdnik",
    );
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /Personal blog/,
    );
    await expect(page.locator('meta[name="author"]')).toHaveAttribute(
      "content",
      "Rok Ajdnik",
    );

    // Open Graph
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      "Rok Ajdnik",
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      /rokajdnik\.com/,
    );

    // Twitter
    await expect(
      page.locator('meta[property="twitter:title"]'),
    ).toHaveAttribute("content", "Rok Ajdnik");

    // Canonical URL
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute("href", /rokajdnik\.com/);
  });

  test("blog post has article-specific meta tags", async ({ page }) => {
    await page.goto("/fizzbuzz-madness-in-javascript");

    await expect(page.locator('meta[name="title"]')).toHaveAttribute(
      "content",
      "FizzBuzz Madness in JavaScript",
    );
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /FizzBuzz/,
    );

    // Should have published time for blog posts
    await expect(
      page.locator('meta[property="article:published_time"]'),
    ).toHaveAttribute("content", /2026/);

    // Should have og:image for posts with cover
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      /.+/,
    );
  });

  test("blog post with canonical URL uses it", async ({ page }) => {
    await page.goto("/zork-the-great-underground-empire");

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute("href", /medium\.com/);
  });

  test("has sitemap link", async ({ page }) => {
    await page.goto("/");

    const sitemap = page.locator('link[rel="sitemap"]');
    await expect(sitemap).toHaveAttribute("href", "/sitemap-index.xml");
  });

  test("has RSS link in head", async ({ page }) => {
    await page.goto("/");

    const rss = page.locator('link[type="application/rss+xml"]');
    await expect(rss).toHaveAttribute("href", "/rss.xml");
  });
});

test.describe("RSS feed", () => {
  test("returns valid XML with blog entries", async ({ request }) => {
    const response = await request.get("/rss.xml");
    expect(response.status()).toBe(200);

    const contentType = response.headers()["content-type"];
    expect(contentType).toContain("xml");

    const body = await response.text();
    expect(body).toContain("<rss");
    expect(body).toContain("<channel>");
    expect(body).toContain("<title>Rok Ajdnik</title>");
    expect(body).toContain("<item>");
    expect(body).toContain("FizzBuzz Madness in JavaScript");
  });
});

test.describe("robots.txt", () => {
  test("returns valid robots.txt with sitemap", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);

    const body = await response.text();
    expect(body).toContain("User-agent: *");
    expect(body).toContain("Allow: /");
    expect(body).toContain("Sitemap:");
    expect(body).toContain("sitemap-index.xml");
  });
});
