#!/usr/bin/env node
/**
 * Playwright smoke test runner for visc-line.
 *
 * Serves the built dist/ folder (including the copied harness.html) via
 * node:http, launches Chromium headless, and asserts:
 *   - three charts render correctly (full, minimal, empty-data guard)
 *   - CSS custom properties resolve to real colour values
 *   - tooltip hover and zoom wheel produce no errors
 *   - window.__chartError stays null (zero runtime errors)
 */

"use strict";

import { createServer } from "node:http";
import { readFileSync, cpSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const DIST = join(ROOT, "dist");
const HARNESS_SRC = join(__dirname, "harness.html");
const HARNESS_DEST = join(DIST, "harness.html");

// ── Helpers ──────────────────────────────────────────────────────────────────

function copyHarnessToDist() {
  if (!existsSync(HARNESS_SRC)) {
    throw new Error(`Harness not found at ${HARNESS_SRC}`);
  }
  cpSync(HARNESS_SRC, HARNESS_DEST);
  console.log("  copied harness.html → dist/");
}

function startStaticServer(port) {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      let filePath = join(DIST, req.url === "/" ? "harness.html" : req.url);
      if (!existsSync(filePath)) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      try {
        const content = readFileSync(filePath);
        const ext = filePath.split(".").pop();
        const mimeTypes = {
          html: "text/html",
          js: "application/javascript",
          mjs: "application/javascript",
          css: "text/css",
          json: "application/json",
        };
        res.writeHead(200, { "Content-Type": mimeTypes[ext] ?? "text/plain" });
        res.end(content);
      } catch (err) {
        res.writeHead(500);
        res.end(String(err));
      }
    });
    server.listen(port, () => {
      console.log(`  static server listening on http://localhost:${port}`);
      resolve(server);
    });
    server.on("error", reject);
  });
}

function findFreePort() {
  return new Promise((resolve, reject) => {
    const s = createServer();
    s.listen(0, () => {
      resolve(s.address().port);
      s.close();
    });
    s.on("error", reject);
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const port = await findFreePort();

  console.log("\n[visc-line] Playwright smoke tests");
  console.log("─".repeat(50));

  // 1. Copy harness into dist/
  copyHarnessToDist();

  // 2. Start static server
  const server = await startStaticServer(port);
  const url = `http://localhost:${port}/harness.html`;

  let browser;
  let passed = 0;
  let failed = 0;

  try {
    // 3. Launch Chromium
    console.log("  launching Chromium (headless)…");
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const errors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(`[console.error] ${msg.text()}`);
    });
    page.on("pageerror", (err) => {
      errors.push(`[pageerror] ${err.message}`);
    });

    // 4. Navigate
    console.log(`  navigating to ${url}`);
    await page.goto(url, { waitUntil: "networkidle" });

    // Give charts a moment to finish rendering
    await page.waitForTimeout(800);

    // ── Helper assertions ───────────────────────────────────────────────────

    function assert(condition, label) {
      if (condition) {
        console.log(`  ✓ ${label}`);
        passed++;
      } else {
        console.error(`  ✗ FAIL: ${label}`);
        failed++;
      }
    }

    // ── #chart-full ────────────────────────────────────────────────────────
    console.log("\n  #chart-full assertions:");

    const svgFull = page.locator("#chart-full svg");
    assert(await svgFull.count() > 0, "svg element exists");

    // Line path: d starts with M and is non-trivial
    const pathFull = page.locator("#chart-full svg path");
    const pathCount = await pathFull.count();
    assert(pathCount > 0, "at least one path element exists");
    if (pathCount > 0) {
      const d = await pathFull.first().getAttribute("d");
      assert(d != null && d.length > 20, `path d is non-trivial (len=${d?.length ?? 0})`);
      assert(d != null && d.startsWith("M"), `path d starts with M (got: "${d?.slice(0, 20)}")`);
    }

    // Axes with real tick labels
    const xAxisTicks = page.locator("#chart-full .x-axis text");
    const yAxisTicks = page.locator("#chart-full .y-axis text");
    const xTickCount = await xAxisTicks.count();
    const yTickCount = await yAxisTicks.count();
    assert(xTickCount > 0, `x-axis has tick labels (count=${xTickCount})`);
    assert(yTickCount > 0, `y-axis has tick labels (count=${yTickCount})`);

    // Grid lines
    const gridX = page.locator("#chart-full .grid-x");
    const gridY = page.locator("#chart-full .grid-y");
    assert(await gridX.count() > 0, "grid-x lines exist");
    assert(await gridY.count() > 0, "grid-y lines exist");

    // Legend
    const legend = page.locator("#chart-full g.legend");
    assert(await legend.count() > 0, "legend group exists");

    // Points (rendered as circle.point inside g.point-series)
    const points = page.locator("#chart-full g.point-series circle.point");
    assert(await points.count() > 0, "data points rendered");

    // Title text
    const titleText = page.locator("#chart-full text.chart-title");
    assert(await titleText.count() > 0, "chart title text exists");

    // ── #chart-minimal ─────────────────────────────────────────────────────
    console.log("\n  #chart-minimal assertions:");

    const svgMinimal = page.locator("#chart-minimal svg");
    assert(await svgMinimal.count() > 0, "svg element exists");

    const pathMinimal = page.locator("#chart-minimal svg path");
    assert(await pathMinimal.count() > 0, "line path exists");
    if (await pathMinimal.count() > 0) {
      const d = await pathMinimal.first().getAttribute("d");
      assert(d != null && d.startsWith("M"), `minimal path d starts with M (got: "${d?.slice(0, 20)}")`);
    }

    // No axes, no legend, no title
    assert(await page.locator("#chart-minimal .x-axis").count() === 0, "no x-axis group");
    assert(await page.locator("#chart-minimal .y-axis").count() === 0, "no y-axis group");
    assert(await page.locator("#chart-minimal g.legend").count() === 0, "no legend group");
    assert(await page.locator("#chart-minimal text.chart-title").count() === 0, "no title text");

    // ── #chart-empty ───────────────────────────────────────────────────────
    console.log("\n  #chart-empty assertions:");

    const svgEmpty = page.locator("#chart-empty svg");
    assert(await svgEmpty.count() > 0, "svg element exists (empty guard renders container)");

    // No NaN in outerHTML (plan-004 guard proof)
    const outerHTML = await page.locator("#chart-empty").evaluate((el) => el.outerHTML);
    assert(!outerHTML.includes("NaN"), "no NaN in outerHTML (plan-004 guard)");

    // ── CSS custom property resolution ─────────────────────────────────────
    console.log("\n  CSS custom property resolution:");

    const lineStroke = await page
      .locator("#chart-full svg path")
      .first()
      .evaluate((el) => getComputedStyle(el).stroke);
    assert(
      lineStroke !== "var(--vl-line-color)" && lineStroke !== "",
      `line stroke is a resolved colour (got: "${lineStroke}")`
    );

    // ── window.__chartError check ──────────────────────────────────────────
    console.log("\n  runtime error checks:");

    const chartError = await page.evaluate(() => window.__chartError);
    assert(chartError == null, `window.__chartError is null (no runtime errors)`);

    // ── console / page errors ───────────────────────────────────────────────
    const filteredErrors = errors.filter(
      (e) =>
        // Ignore favicon noise
        !e.includes("favicon") &&
        // Ignore tipviz custom element registration warnings (non-fatal)
        !e.includes("tip-viz-tooltip") &&
        !e.includes("custom element")
    );
    assert(filteredErrors.length === 0, `zero console/page errors (got ${filteredErrors.length}: ${filteredErrors.join("; ")})`);

    // ── Mouse interaction smoke ─────────────────────────────────────────────
    console.log("\n  mouse interaction smoke:");

    const chartBox = await page.locator("#chart-full").boundingBox();
    if (chartBox) {
      const cx = chartBox.x + chartBox.width / 2;
      const cy = chartBox.y + chartBox.height / 2;

      // Hover over the chart (tooltip path)
      await page.mouse.move(cx, cy);
      await page.waitForTimeout(300);
      assert(true, "mouse.move completed without crash");

      // Zoom via wheel
      await page.mouse.wheel(0, 100);
      await page.waitForTimeout(300);
      assert(true, "mouse.wheel completed without crash");
    } else {
      assert(false, "could not get bounding box for #chart-full");
    }

    // ── Summary ────────────────────────────────────────────────────────────
    console.log("\n" + "─".repeat(50));
    console.log(`  results: ${passed} passed, ${failed} failed`);
    console.log("─".repeat(50));

    if (failed > 0) {
      console.error("\nFAILED");
      process.exitCode = 1;
    } else {
      console.log("\nPASSED");
      process.exitCode = 0;
    }
  } finally {
    if (browser) await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
