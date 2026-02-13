import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";
import { chromium } from "@playwright/test";

const PORT = 4322;
const BASE_URL = `http://localhost:${PORT}`;
const THRESHOLD = 90;

// --json <path> writes results to a JSON file
const jsonFlagIdx = process.argv.indexOf("--json");
const jsonOutputPath =
  jsonFlagIdx !== -1 ? process.argv[jsonFlagIdx + 1] : null;

const PAGES = [
  { path: "/", name: "Homepage" },
  { path: "/fizzbuzz-madness-in-javascript", name: "Blog Post" },
  { path: "/cv", name: "CV" },
  { path: "/tags", name: "Tags" },
  { path: "/archive/1", name: "Archive" },
  { path: "/404", name: "404" },
];

const MODES = [
  { name: "light", chromeFlags: [] },
  {
    name: "dark",
    chromeFlags: ["--blink-settings=preferredColorScheme=2"],
  },
];

async function waitForServer(url, timeout = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Server at ${url} did not respond within ${timeout}ms`);
}

function formatName(key) {
  return key
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

async function main() {
  // Start the Astro preview server
  const server = spawn("npx", ["astro", "preview", "--port", String(PORT)], {
    stdio: "pipe",
    cwd: process.cwd(),
  });

  server.on("error", (err) => {
    console.error("Failed to start preview server:", err.message);
    process.exit(1);
  });

  try {
    await waitForServer(BASE_URL);
  } catch (err) {
    console.error(err.message);
    server.kill();
    process.exit(1);
  }

  const chromePath = chromium.executablePath();
  const results = [];

  for (const mode of MODES) {
    for (const page of PAGES) {
      const url = `${BASE_URL}${page.path}`;
      const chrome = await launch({
        chromePath,
        chromeFlags: [
          "--headless",
          "--no-sandbox",
          "--disable-gpu",
          ...mode.chromeFlags,
        ],
      });

      const { lhr } = await lighthouse(url, {
        port: chrome.port,
        output: "json",
        logLevel: "error",
      });

      const scores = {};
      for (const [key, category] of Object.entries(lhr.categories)) {
        scores[key] = Math.round(category.score * 100);
      }
      results.push({ ...page, mode: mode.name, scores });

      await chrome.kill();
    }
  }

  server.kill();

  // Print table
  const categories = Object.keys(results[0].scores);
  const nameWidth = 24;
  const modeWidth = 8;
  const colWidth = 18;

  let allPassed = true;

  for (const mode of MODES) {
    const modeResults = results.filter((r) => r.mode === mode.name);

    console.log(`\n  ${mode.name.toUpperCase()} MODE`);
    console.log(
      "Page".padEnd(nameWidth) +
        categories.map((c) => formatName(c).padStart(colWidth)).join(""),
    );
    console.log("\u2500".repeat(nameWidth + categories.length * colWidth));

    for (const r of modeResults) {
      let line = r.name.padEnd(nameWidth);
      for (const cat of categories) {
        const score = r.scores[cat];
        const color =
          score >= 90 ? "\x1b[32m" : score >= 50 ? "\x1b[33m" : "\x1b[31m";
        line += `${color}${String(score).padStart(colWidth)}\x1b[0m`;
        if (score < THRESHOLD) allPassed = false;
      }
      console.log(line);
    }
  }

  console.log();

  if (jsonOutputPath) {
    writeFileSync(
      jsonOutputPath,
      JSON.stringify({ threshold: THRESHOLD, results }, null, 2),
    );
    console.log(`Results written to ${jsonOutputPath}`);
  }

  if (allPassed) {
    console.log(
      `\x1b[32mAll scores meet the threshold (${THRESHOLD}).\x1b[0m\n`,
    );
  } else {
    console.log(
      `\x1b[33mSome scores are below the threshold (${THRESHOLD}).\x1b[0m\n`,
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
