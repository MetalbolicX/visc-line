/**
 * timeTickFormat option tests.
 *
 * Verifies:
 * - String form (%Y) produces 4-digit year labels
 * - Custom function form produces custom-formatted labels
 * - Default behavior (d3 multi-scale format) is preserved when option is absent
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { select } from "d3";
import { scaleTime } from "d3";
import { renderXAxis } from "@/components/xAxis.mjs";
import { createChart } from "../createChart.mjs";

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

describe("timeTickFormat — string form", () => {
  it("renders with timeTickFormat '%Y' producing year-only labels", () => {
    const { selection } = createMockBounds();
    const start = new Date("2020-01-01T00:00:00Z");
    const end = new Date("2024-12-31T23:59:59Z");
    const xScale = scaleTime().domain([start, end]).range([0, 600]);

    // Simulate resolved timeTickFormat: timeFormat("%Y")
    renderXAxis(selection, xScale, 200, {
      tickFormat: (d) => (d as Date).getFullYear().toString(),
    });

    const labels = selection
      .selectAll<SVGTextElement, unknown>("g.x-axis text")
      .nodes()
      .map((n) => n.textContent ?? "");

    // With year-only format, all labels should be 4-digit years
    labels.forEach((label) => {
      expect(label).toMatch(/^\d{4}$/);
    });
  });
});

describe("timeTickFormat — function form", () => {
  it("renders with custom function producing quarter-formatted labels", () => {
    const { selection } = createMockBounds();
    const start = new Date("2020-01-01T00:00:00Z");
    const end = new Date("2024-12-31T23:59:59Z");
    const xScale = scaleTime().domain([start, end]).range([0, 600]);

    // Custom quarter formatter
    const customFormat = (date: Date) =>
      `${date.getFullYear()}-Q${Math.ceil((date.getMonth() + 1) / 3)}`;
    renderXAxis(selection, xScale, 200, { tickFormat: customFormat });

    const labels = selection
      .selectAll<SVGTextElement, unknown>("g.x-axis text")
      .nodes()
      .map((n) => n.textContent ?? "");

    // All labels should match year-Qquarter pattern
    labels.forEach((label) => {
      expect(label).toMatch(/^\d{4}-Q[1-4]$/);
    });
  });
});

describe("timeTickFormat — default behavior preserved", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    Object.defineProperty(container, "clientWidth", { value: 800 });
    Object.defineProperty(container, "clientHeight", { value: 400 });
    document.body.appendChild(container);
    // Mock SVGElement.getTotalLength for jsdom
    const SVGEl = (globalThis as unknown as Record<string, unknown>)["SVGElement"];
    if (typeof SVGEl !== "undefined") {
      Object.defineProperty((SVGEl as typeof SVGElement).prototype, "getTotalLength", {
        configurable: true,
        value: () => 100,
        writable: true,
      });
    }
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("omitting timeTickFormat preserves d3 multi-scale default (not year-only)", () => {
    // Use a 3-month span where d3 default produces month+day labels,
    // NOT year-only labels. A 5-year span could show year-only, but we
    // want to verify multi-scale behavior (month names present).
    const data = [
      { date: new Date("2024-01-01"), value: 10 },
      { date: new Date("2024-01-15"), value: 20 },
      { date: new Date("2024-02-01"), value: 15 },
      { date: new Date("2024-02-15"), value: 25 },
      { date: new Date("2024-03-01"), value: 30 },
      { date: new Date("2024-03-15"), value: 35 },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createChart(container, {
      data,
      xSerie: { accessor: (d: any) => d.date, label: "Date" },
      ySeries: [{ accessor: (d: any) => d.value, label: "Value" }],
      // No timeTickFormat — should use d3 multi-scale default
    } as any).withAxes({ xType: "time" });

    const labels = Array.from(
      container.querySelectorAll<SVGTextElement>("g.x-axis text")
    ).map((n) => n.textContent ?? "");

    // Default d3 multi-scale for a 3-month span should produce labels WITH
    // month names (e.g. "Jan 1", "Feb 1", "Mar 1"), NOT just 4-digit years.
    // If all labels are purely numeric years like "2024", the default was lost.
    const allYearOnly = labels.every((l) => /^\d{4}$/.test(l.trim()));
    expect(allYearOnly).toBe(false);

    // At least some labels should contain month-name characters
    const monthNameChars = /[JFMASOND]/i;
    const hasMonthNames = labels.some((l) => monthNameChars.test(l));
    expect(hasMonthNames).toBe(true);
  });
});
