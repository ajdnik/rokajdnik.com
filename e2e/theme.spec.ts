import { test, expect } from "@playwright/test";

test.describe("Theme toggle", () => {
  test("page loads with a theme class on html", async ({ page }) => {
    await page.goto("/");

    const html = page.locator("html");
    const classList = await html.getAttribute("class");
    expect(classList).toMatch(/dark|light/);
  });

  test("clicking theme toggle switches from dark to light", async ({
    page,
  }) => {
    // Set dark theme via localStorage before navigating
    await page.addInitScript(() => {
      localStorage.setItem("theme", "dark");
    });
    await page.goto("/");

    const html = page.locator("html");
    await expect(html).toHaveClass(/dark/);

    const toggle = page.locator('button[aria-label="toggle theme"]');
    await toggle.click();

    await expect(html).toHaveClass(/light/);
    await expect(html).not.toHaveClass(/dark/);
  });

  test("clicking theme toggle switches from light to dark", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem("theme", "light");
    });
    await page.goto("/");

    const html = page.locator("html");
    await expect(html).toHaveClass(/light/);

    const toggle = page.locator('button[aria-label="toggle theme"]');
    await toggle.click();

    await expect(html).toHaveClass(/dark/);
    await expect(html).not.toHaveClass(/light/);
  });

  test("theme persists across page navigations", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("theme", "light");
    });
    await page.goto("/");

    const html = page.locator("html");
    await expect(html).toHaveClass(/light/);

    // Navigate to another page
    await page.goto("/cv");
    await expect(html).toHaveClass(/light/);
  });

  test("theme persists after toggling and navigating", async ({ page }) => {
    await page.goto("/");

    // Ensure we start in dark mode
    await page.evaluate(() => localStorage.setItem("theme", "dark"));
    await page.evaluate(() => {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    });

    const html = page.locator("html");
    await expect(html).toHaveClass(/dark/);

    const toggle = page.locator('button[aria-label="toggle theme"]');
    await toggle.click();

    await expect(html).toHaveClass(/light/);

    // Navigate via link click to preserve localStorage
    await page.locator('header a[href="/tags"]').click();
    await expect(page).toHaveURL("/tags");
    await expect(html).toHaveClass(/light/);
  });
});
