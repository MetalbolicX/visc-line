/**
 * Empirical baseline for time-axis tick behavior across domain spans.
 *
 * Tests verify:
 * - Tick count is in a sensible range (3–15) for 1 day, 1 month, 5 year spans
 * - Labels are non-empty strings
 * - Default d3 multi-scale formatting produces expected patterns per span
 *
 * This is the baseline that design doc §Current Behavior diffs against.
 */

import { describe, expect, it, afterEach } from "vitest";
import { select } from "d3";
import { scaleTime } from "d3";
import { renderXAxis } from "@/components/xAxis.mjs";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_MONTH_MS = 30 * ONE_DAY_MS;
const ONE_YEAR_MS = 365 * ONE_DAY_MS;

// Minimal mock — same pattern as xAxis.test.mts
const createMockBounds = (innerHeight = 200) => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  container.appendChild(svg);
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("class", "bounds");
  svg.appendChild(g);
  const selection = select(g as SVGGElement);
  Object.defineProperty(container, "clientWidth", { value: 800 });
  Object.defineProperty(container, "clientHeight", { value: innerHeight + 50 });
  return { container, svg, g, selection };
};

afterEach(() => {
  document.body.innerHTML = "";
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("timeAxisBaseline", () => {
  it("1-day span: tick count in sensible range and labels are non-empty", () => {
    const { selection } = createMockBounds();
    const start = new Date("2024-01-15T00:00:00Z");
    const end = new Date(start.getTime() + ONE_DAY_MS);
    const xScale = scaleTime().domain([start, end]).range([0, 600]);

    renderXAxis(selection, xScale, 200);

    const labels = selection
      .selectAll<SVGTextElement, unknown>("g.x-axis text")
      .nodes()
      .map((n) => n.textContent ?? "");

    expect(labels.length).toBeGreaterThanOrEqual(3);
    expect(labels.length).toBeLessThanOrEqual(15);
    labels.forEach((label) => {
      expect(label.trim().length).toBeGreaterThan(0);
    });
  });

  it("1-month span: tick count in sensible range and labels are non-empty", () => {
    const { selection } = createMockBounds();
    const start = new Date("2024-01-15T00:00:00Z");
    const end = new Date(start.getTime() + ONE_MONTH_MS);
    const xScale = scaleTime().domain([start, end]).range([0, 600]);

    renderXAxis(selection, xScale, 200);

    const labels = selection
      .selectAll<SVGTextElement, unknown>("g.x-axis text")
      .nodes()
      .map((n) => n.textContent ?? "");

    expect(labels.length).toBeGreaterThanOrEqual(3);
    expect(labels.length).toBeLessThanOrEqual(15);
    labels.forEach((label) => {
      expect(label.trim().length).toBeGreaterThan(0);
    });
  });

  it("5-year span: tick count in sensible range and labels are non-empty", () => {
    const { selection } = createMockBounds();
    const start = new Date("2020-01-01T00:00:00Z");
    const end = new Date(start.getTime() + 5 * ONE_YEAR_MS);
    const xScale = scaleTime().domain([start, end]).range([0, 600]);

    renderXAxis(selection, xScale, 200);

    const labels = selection
      .selectAll<SVGTextElement, unknown>("g.x-axis text")
      .nodes()
      .map((n) => n.textContent ?? "");

    expect(labels.length).toBeGreaterThanOrEqual(3);
    expect(labels.length).toBeLessThanOrEqual(15);
    labels.forEach((label) => {
      expect(label.trim().length).toBeGreaterThan(0);
    });
  });

  it("5-year span: shows year-level granularity, not daily ticks", () => {
    const { selection } = createMockBounds();
    const start = new Date("2020-01-01T00:00:00Z");
    const end = new Date(start.getTime() + 5 * ONE_YEAR_MS);
    const xScale = scaleTime().domain([start, end]).range([0, 600]);

    renderXAxis(selection, xScale, 200);

    const labels = selection
      .selectAll<SVGTextElement, unknown>("g.x-axis text")
      .nodes()
      .map((n) => n.textContent ?? "");

    // 5-year span should produce at most ~6 year-level ticks
    expect(labels.length).toBeLessThanOrEqual(7);
    // Should show year values like "2020", "2022", etc.
    const hasYearLabels = labels.some((l) => /\d{4}/.test(l));
    expect(hasYearLabels).toBe(true);
  });
});


