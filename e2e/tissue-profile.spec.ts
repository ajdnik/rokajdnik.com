import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  tissueBarPosition,
  tissueStateAt,
} from "../src/components/tissue-profile-data";

test("tissue snapshots agree with independent numerical integration of the article's model", () => {
  const article = readFileSync(
    "src/blog/the-algorithm-inside-a-dive-computer.mdx",
    "utf8",
  );
  const table = article.match(
    /static ZH_L16C_N2: GasTable = GasTable \{([\s\S]*?)\n\};/,
  )![1];
  const row = (key: string) =>
    table
      .match(new RegExp(`${key}: \\[([^\\]]+)\\]`))![1]
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
      .map(Number);
  const halfTimes = row("half_times"),
    a = row("a"),
    b = row("b");
  const waypoints = [
    [0, 0],
    [75, 25],
    [375, 25],
    [465, 10],
    [1665, 10],
    [1695, 5],
    [1875, 5],
    [1905, 0],
  ];
  const inspired = (depth: number) => 0.79 * (1.01325 + depth / 10 - 0.0627);
  let tensions = halfTimes.map(() => inspired(0));
  expect(
    tissueStateAt(0).tissues.every((t) => t.direction === "Equilibrium"),
  ).toBe(true);
  for (let section = 1; section < waypoints.length; section++) {
    const [start, startDepth] = waypoints[section - 1];
    const [end, endDepth] = waypoints[section];
    const depthAt = (second: number) =>
      startDepth + ((endDepth - startDepth) * (second - start)) / (end - start);
    for (let second = start + 1; second <= end; second++) {
      // RK4 integration of dP/dt = k * (inspired - P), independent of Schreiner.
      const dt = 1 / 60;
      tensions = tensions.map((p, i) => {
        const rate = (time: number, tension: number) =>
          (Math.LN2 / halfTimes[i]) * (inspired(depthAt(time)) - tension);
        const k1 = rate(second - 1, p);
        const k2 = rate(second - 0.5, p + (dt * k1) / 2);
        const k3 = rate(second - 0.5, p + (dt * k2) / 2);
        const k4 = rate(second, p + dt * k3);
        return p + (dt * (k1 + 2 * k2 + 2 * k3 + k4)) / 6;
      });
      if (second === end || second % 37 === 0) {
        const snapshot = tissueStateAt(second);
        expect(snapshot.depth).toBeCloseTo(depthAt(second), 10);
        expect(snapshot.ceiling).toBe(0);
        snapshot.tissues.forEach((t, i) => {
          expect(t.halfTime).toBe(halfTimes[i]);
          expect(t.tension).toBeCloseTo(tensions[i], 8);
          expect(t.mValue).toBeCloseTo(a[i] + snapshot.ambient / b[i], 10);
          expect(
            tissueBarPosition(snapshot.ambient, snapshot.ambient, t.mValue),
          ).toBe(60);
          expect(tissueBarPosition(t.mValue, snapshot.ambient, t.mValue)).toBe(
            90,
          );
        });
      }
    }
  }
  expect(
    tissueStateAt(375).tissues.every((t) => t.direction === "On-gassing"),
  ).toBe(true);
  expect(
    tissueStateAt(1905).tissues.every((t) => t.direction === "Off-gassing"),
  ).toBe(true);
});

for (const width of [375, 1100]) {
  test(`tissue timeline responds to slider changes at ${width}px`, async ({
    page,
  }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 1000 });
    await page.addInitScript(() => localStorage.setItem("theme", "dark"));
    await page.goto("/the-algorithm-inside-a-dive-computer/");
    const graph = page.locator('[data-chart="tissue-profile"]');
    await graph.scrollIntoViewIfNeeded();
    const slider = graph.getByRole("slider", { name: "Dive timeline" });
    await expect(slider).toBeEnabled();
    await expect(graph.locator(".tissue-row")).toHaveCount(16);
    await expect(graph.locator(".tissue-row").first()).toHaveAttribute(
      "aria-label",
      /Equilibrium/,
    );
    const setTime = async (seconds: number) => {
      await slider.evaluate((element, value) => {
        const setter = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          "value",
        )!.set!;
        setter.call(element, String(value));
        element.dispatchEvent(new Event("input", { bubbles: true }));
      }, seconds);
    };
    await setTime(375);
    await expect(slider).toHaveValue("375");
    await expect(graph.locator('[data-metric="time"]')).toHaveText("6:15");
    await expect(graph.locator('[data-metric="depth"]')).toHaveText("25.0 m");
    await expect(graph.locator(".tissue-row").first()).toHaveAttribute(
      "aria-label",
      /On-gassing/,
    );
    await slider.focus();
    await page.keyboard.press("ArrowRight");
    await expect(slider).toHaveValue("376");
    await expect(slider).toHaveAttribute(
      "aria-valuetext",
      "6:16 elapsed, 24.8 metres",
    );
    await setTime(1665);
    const bounds = (await graph.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width + 1);
    expect(await graph.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
      true,
    );
    await graph.screenshot({
      path: testInfo.outputPath(`tissues-${width}-dark.png`),
    });
    await page
      .locator("#theme-toggle")
      .evaluate((el: HTMLButtonElement) => el.click());
    await expect(page.locator("html")).toHaveClass(/light/);
    await page.evaluate(async () => {
      await Promise.all(
        document
          .getAnimations()
          .map((animation) => animation.finished.catch(() => {})),
      );
    });
    await graph.screenshot({
      path: testInfo.outputPath(`tissues-${width}-light.png`),
    });
    await slider.focus();
    await page.keyboard.press("End");
    await expect(slider).toHaveValue("1905");
    await expect(graph.locator('[data-metric="time"]')).toHaveText("31:45");
    await expect(graph.locator(".tissue-row").first()).toHaveAttribute(
      "aria-label",
      /Off-gassing/,
    );
    await page.keyboard.press("Home");
    await expect(slider).toHaveValue("0");
    await expect(graph.locator(".tissue-row").first()).toHaveAttribute(
      "aria-label",
      /Equilibrium/,
    );
    expect(errors).toEqual([]);
  });
}

test("tissue display provides a labelled surface snapshot without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 375, height: 900 },
  });
  const page = await context.newPage();
  await page.goto(
    new URL("/the-algorithm-inside-a-dive-computer/", baseURL).href,
  );
  const graph = page.locator('[data-chart="tissue-profile"]');
  await expect(graph.locator(".tissue-row")).toHaveCount(16);
  await expect(graph.getByRole("slider")).toBeDisabled();
  await expect(graph.locator("noscript p")).toContainText(
    "surface equilibrium",
  );
  await context.close();
});
