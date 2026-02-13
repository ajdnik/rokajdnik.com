import { test, expect } from "@playwright/test";

test.describe("CV page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/cv");
  });

  test("has correct page title", async ({ page }) => {
    await expect(page).toHaveTitle("CV | Rok Ajdnik");
  });

  test("displays summary section", async ({ page }) => {
    const summary = page.locator("section.center p").first();
    await expect(summary).toContainText("Director of Software Engineering");
  });

  test("displays experience section with entries", async ({ page }) => {
    const experienceHeading = page.getByRole("heading", {
      name: "Experience",
      exact: true,
    });
    await expect(experienceHeading).toBeVisible();

    const jobTitles = page.locator(".cv-item h3");
    await expect(jobTitles).not.toHaveCount(0);
  });

  test("displays skills section with categories", async ({ page }) => {
    const skillsHeading = page.getByRole("heading", { name: "Skills" });
    await expect(skillsHeading).toBeVisible();

    // Should have skill categories
    for (const category of [
      "Leadership",
      "Technical",
      "Domain Expertise",
      "Languages",
    ]) {
      await expect(page.getByRole("heading", { name: category })).toBeVisible();
    }
  });

  test("displays education section", async ({ page }) => {
    const educationHeading = page.getByRole("heading", {
      name: "Education",
    });
    await expect(educationHeading).toBeVisible();
    await expect(page.locator("section.center")).toContainText(
      "University of Maribor",
    );
  });

  test("displays certifications section", async ({ page }) => {
    const certHeading = page.getByRole("heading", {
      name: "Certifications",
    });
    await expect(certHeading).toBeVisible();
    await expect(page.locator("section.center")).toContainText(
      "Certified ScrumMaster",
    );
  });

  test("displays LinkedIn CTA button", async ({ page }) => {
    const linkedinCTA = page.locator('a', {
      hasText: "Connect on LinkedIn",
    });
    await expect(linkedinCTA).toBeVisible();
    await expect(linkedinCTA).toHaveAttribute(
      "href",
      "https://linkedin.com/in/rokajdnik",
    );
  });
});
