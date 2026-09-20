import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { diveProfileData } from "../src/components/dive-profile-data";
import {
  loadingData,
  loadingCompartments,
  mValueData,
  mValueExample,
  allowedTension,
  gradientFactorAt,
  SURFACE_PRESSURE,
} from "../src/components/dive-chart-data";

test("loading samples retain the article's verified square-profile values", () => {
  expect(loadingData[0].compartment1).toBeCloseTo(0.7509345, 10);
  expect(loadingData[10].compartment1).toBeCloseTo(1.9359345, 10); // one 5-minute half-time
  expect(loadingData[60].compartment1).toBeCloseTo(3.08390325, 10);
  expect(loadingData.at(-1)!.compartment16).toBeCloseTo(0.8179140520228215, 10);
  expect(loadingData[59].inspired).toBeCloseTo(3.1209345, 10);
  expect(loadingData[60].inspired).toBeCloseTo(0.7509345, 10);
  for (const { key } of loadingCompartments) {
    for (let i = 1; i <= 60; i++)
      expect(loadingData[i][key]).toBeGreaterThan(loadingData[i - 1][key]);
    for (let i = 61; i < loadingData.length; i++)
      expect(loadingData[i][key]).toBeLessThan(loadingData[i - 1][key]);
  }
});

test("M-value plot agrees with all sixteen C compartments and the verified intersections", () => {
  const article = readFileSync(
    "src/blog/the-algorithm-inside-a-dive-computer.mdx",
    "utf8",
  );
  const table = article.match(
    /static ZH_L16C_N2: GasTable = GasTable \{([\s\S]*?)\n\};/,
  )![1];
  const row = (name: string) =>
    table
      .match(new RegExp(`${name}: \\[([^\\]]+)\\]`))![1]
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
      .map(Number);
  const halfTimes = row("half_times"),
    a = row("a"),
    b = row("b");
  const initial = 0.79 * (SURFACE_PRESSURE - 0.0627);
  const inspired = 0.79 * (SURFACE_PRESSURE + 4 - 0.0627);
  const tensions = halfTimes.map(
    (h) => inspired + (initial - inspired) * Math.exp((-Math.LN2 * 25) / h),
  );
  const raw = tensions.map((p, i) => (p - a[i]) * b[i]);
  const low = tensions.map((p, i) => (p - 0.3 * a[i]) / (0.7 + 0.3 / b[i]));
  expect(raw.indexOf(Math.max(...raw))).toBe(1);
  expect(low.indexOf(Math.max(...low))).toBe(1);
  expect(mValueExample.rawCeiling).toBeCloseTo(Math.max(...raw), 10);
  expect(mValueExample.gfCeiling).toBeCloseTo(Math.max(...low), 10);
  expect(mValueExample.tension).toBeCloseTo(3.548717902934155, 10);
  expect(mValueExample.rawDepth).toBeCloseTo(6.4698484197130846, 10);
  expect(mValueExample.gfDepth).toBeCloseTo(17.860500370000643, 10);
  expect(allowedTension(mValueExample.gfCeiling)).toBeCloseTo(
    mValueExample.tension,
    10,
  );
  expect(gradientFactorAt(SURFACE_PRESSURE)).toBeCloseTo(0.7, 10);
  expect(gradientFactorAt(mValueExample.gfCeiling)).toBeCloseTo(0.3, 10);
  for (const intersection of [
    mValueExample.rawCeiling,
    mValueExample.gfCeiling,
  ]) {
    expect(mValueData.some((p) => p.pressure === intersection)).toBe(true);
  }
});

test("multilevel profile includes every stay and travels at the specified rates", () => {
  expect(diveProfileData).toHaveLength(1906); // surface, then 1,905 seconds
  for (const [second, depth] of [
    [0, 0],
    [75, 25],
    [375, 25],
    [465, 10],
    [1665, 10],
    [1695, 5],
    [1875, 5],
    [1905, 0],
  ]) {
    expect(diveProfileData[second].time).toBeCloseTo(second / 60, 10);
    expect(diveProfileData[second].depth).toBe(depth);
  }
  for (let second = 1; second < diveProfileData.length; second++) {
    const previous = diveProfileData[second - 1];
    const current = diveProfileData[second];
    const speed =
      (current.depth - previous.depth) / (current.time - previous.time);
    const expected =
      second <= 75
        ? 20
        : (second > 375 && second <= 465) ||
            (second > 1665 && second <= 1695) ||
            second > 1875
          ? -10
          : 0;
    expect(speed).toBeCloseTo(expected, 8);
  }
});

const charts = [
  {
    slug: "the-algorithm-inside-a-dive-computer",
    id: "compartment-loading",
    lines: 5,
  },
  {
    slug: "the-algorithm-inside-a-dive-computer",
    id: "dive-profile",
    lines: 1,
  },
  {
    slug: "the-algorithm-inside-a-technical-dive-computer",
    id: "m-values",
    lines: 4,
  },
];

for (const chart of charts) {
  for (const width of [375, 1100]) {
    test(`${chart.id} is interactive and fits at ${width}px in both themes`, async ({
      page,
    }, testInfo) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(() => localStorage.setItem("theme", "dark"));
      await page.goto(`/${chart.slug}/`);
      const plot = page.locator(`[data-chart="${chart.id}"]`);
      await plot.scrollIntoViewIfNeeded();
      await expect
        .poll(async () => ({
          curves: await plot.locator(".recharts-line-curve").count(),
          errors,
        }))
        .toEqual({ curves: chart.lines, errors: [] });
      await expect(plot.locator(".dive-chart-static")).toHaveCount(0);
      const bounds = (await plot.boundingBox())!;
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width + 1);
      const svg = plot.locator(".recharts-surface");
      const svgBounds = (await svg.boundingBox())!;
      await svg.hover({
        position: { x: svgBounds.width / 2, y: svgBounds.height / 2 },
      });
      await expect(plot.locator(".dive-chart-tooltip")).toBeVisible();
      await page.mouse.move(0, 0);
      await svg.focus();
      await page.keyboard.press("ArrowRight");
      await expect(plot.locator(".dive-chart-tooltip")).toBeVisible();
      await expect(plot.locator(".dive-chart-tooltip")).toContainText(
        chart.id === "dive-profile" ? " m" : "bar",
      );
      await page.keyboard.press("Escape");
      await expect(plot.locator(".dive-chart-tooltip")).not.toBeVisible();
      await page.mouse.move(0, 0);
      await svg.evaluate((element) => (element as SVGElement).blur());
      const curve = plot
        .locator(".recharts-line-curve")
        .nth(chart.id === "m-values" ? 2 : 0);
      const darkStroke = await curve.evaluate(
        (element) => getComputedStyle(element).stroke,
      );
      await plot.screenshot({
        path: testInfo.outputPath(`${chart.id}-${width}-dark.png`),
      });
      await page
        .locator("#theme-toggle")
        .evaluate((element: HTMLButtonElement) => element.click());
      await expect(page.locator("html")).toHaveClass(/light/);
      await expect
        .poll(() =>
          curve.evaluate((element) => getComputedStyle(element).stroke),
        )
        .not.toBe(darkStroke);
      await page.evaluate(async () => {
        await Promise.all(
          document
            .getAnimations()
            .map((animation) => animation.finished.catch(() => {})),
        );
      });
      await plot.screenshot({
        path: testInfo.outputPath(`${chart.id}-${width}-light.png`),
      });
      expect(errors).toEqual([]);
    });
  }

  test(`${chart.id} has a readable graph without JavaScript`, async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 375, height: 900 },
    });
    const page = await context.newPage();
    await page.goto(new URL(`/${chart.slug}/`, baseURL).href);
    const plot = page.locator(`[data-chart="${chart.id}"]`);
    await plot.scrollIntoViewIfNeeded();
    await expect(plot.locator('svg[role="img"]')).toBeVisible();
    await expect(plot.locator(".dive-chart-static path")).toHaveCount(
      chart.lines,
    );
    await expect(plot.locator(".dive-chart-legend li")).toHaveCount(
      chart.lines,
    );
    const fallback = plot.locator(".dive-chart-fallback");
    expect(
      await fallback.evaluate(
        (element) => element.scrollWidth > element.clientWidth,
      ),
    ).toBe(true);
    if (chart.id === "m-values")
      await expect(plot.locator(".dive-chart-metrics")).toContainText("17.9 m");
    await context.close();
  });
}
