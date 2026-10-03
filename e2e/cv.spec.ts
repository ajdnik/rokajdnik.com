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
      "Engineering",
      "Domain Expertise",
      "Spoken Languages",
    ]) {
      await expect(
        page.getByRole("heading", { name: category, exact: true }),
      ).toBeVisible();
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
    const linkedinCTA = page.locator("a", {
      hasText: "Connect on LinkedIn",
    });
    await expect(linkedinCTA).toBeVisible();
    await expect(linkedinCTA).toHaveAttribute(
      "href",
      "https://linkedin.com/in/rokajdnik",
    );
  });

  test("offers a downloadable PDF", async ({ page, request }) => {
    const link = page.locator("a", { hasText: "Download CV (PDF)" });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("download", "");
    const href = await link.getAttribute("href");
    expect(href).toMatch(/\.pdf$/);

    const response = await request.get(href!);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/pdf");
  });

  test("shows achievements, patents, talks and open source", async ({
    page,
  }) => {
    const main = page.locator("section.center");
    await expect(main).toContainText("zero downtime");
    await expect(main).toContainText("20 million images");
    for (const name of ["Patents", "Conference Talks"]) {
      await expect(page.getByRole("heading", { name })).toBeVisible();
    }
    await expect(main).toContainText("ROSUS 2018");
    await expect(
      page.locator('a[href="https://github.com/ajdnik/imghash"]'),
    ).toBeVisible();
  });


  test("exposes Person JSON-LD", async ({ page }) => {
    const raw = await page
      .locator('script[type="application/ld+json"]')
      .first()
      .textContent();
    const data = JSON.parse(raw!);
    expect(data["@type"]).toBe("Person");
    expect(data.name).toBe("Rok Ajdnik");
    expect(data.jobTitle).toBe("Director of Software Engineering");
    expect(data.worksFor.name).toBe("Plume Design, Inc.");
    expect(data.sameAs).toContain("https://linkedin.com/in/rokajdnik");
    expect(raw).not.toContain("@gmail.com");
  });
});
