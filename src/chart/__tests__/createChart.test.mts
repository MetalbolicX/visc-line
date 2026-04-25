import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { ChartConfig, Theme } from "../../types/index.mjs";
import { defaultTheme } from "../../themes/defaultTheme.mjs";
import { createChart } from "../createChart.mjs";

interface TestData {
  date: Date;
  revenue: number;
  cost: number;
}

const data: TestData[] = [
  { date: new Date("2023-01-01"), revenue: 100, cost: 10 },
  { date: new Date("2023-01-02"), revenue: 120, cost: 15 },
  { date: new Date("2023-01-03"), revenue: 90, cost: 12 },
  { date: new Date("2023-01-04"), revenue: 150, cost: 20 },
];

const config: ChartConfig<TestData> = {
  data,
  xSerie: { accessor: (d) => d.date, label: "Date" },
  ySeries: [
    { accessor: (d) => d.revenue, label: "Revenue" },
    { accessor: (d) => d.cost, label: "Cost" },
  ],
};

const reducedMotionTheme: Partial<Theme> = {
  accessibility: { reducedMotion: true },
};

describe("createChart", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    Object.defineProperty(container, "clientWidth", { value: 800 });
    Object.defineProperty(container, "clientHeight", { value: 400 });
    document.body.appendChild(container);
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

  describe("base instance", () => {
    it("returns the provided container", () => {
      const instance = createChart(container, config);
      expect(instance.container).toBe(container);
    });

    it("svg is an SVGSVGElement", () => {
      const instance = createChart(container, config);
      expect(instance.svg.node()).toBeInstanceOf(SVGSVGElement);
    });

    it("renders one path.chart-line per series", () => {
      createChart(container, config);
      const lines = container.querySelectorAll("g.content path.chart-line");
      expect(lines.length).toBe(2);
    });

    it("does not render optional layers by default", () => {
      createChart(container, config);
      expect(container.querySelector("g.bounds > g.x-axis")).toBeNull();
      expect(container.querySelector("line.grid-x")).toBeNull();
      expect(container.querySelector("circle.point")).toBeNull();
      expect(container.querySelector("text.chart-title")).toBeNull();
    });
  });

  describe("builder methods", () => {
    it("with methods return stable chart instance", () => {
      const chart = createChart(container, config);
      expect(chart.withAxes()).toBe(chart);
      expect(chart.withGrid()).toBe(chart);
      expect(chart.withPoints()).toBe(chart);
    });

    it("withAxes renders both axis groups and labels", () => {
      createChart(container, config).withAxes();
      expect(container.querySelector("g.bounds > g.x-axis")).toBeTruthy();
      expect(container.querySelector("g.bounds > g.y-axis")).toBeTruthy();
      expect(container.querySelector("text.x-axis-label")).toBeTruthy();
      expect(container.querySelector("text.y-axis-label")).toBeTruthy();
    });

    it("withGrid renders grid lines", () => {
      createChart(container, config).withGrid();
      expect(container.querySelector("line.grid-x")).toBeTruthy();
      expect(container.querySelector("line.grid-y")).toBeTruthy();
    });

    it("withPoints renders point circles", () => {
      createChart(container, config).withPoints();
      expect(container.querySelectorAll("g.content circle.point").length).toBe(data.length * 2);
    });

    it("withTitle renders chart title", () => {
      createChart(container, config).withTitle({ title: "My Chart" });
      expect(container.querySelector("text.chart-title")?.textContent).toBe("My Chart");
    });

    it("withLegend renders legend group", () => {
      createChart(container, config).withLegend({
        items: [
          { color: "steelblue", label: "Revenue" },
          { color: "tomato", label: "Cost" },
        ],
      });
      expect(container.querySelector("g.legend")).toBeTruthy();
      expect(container.querySelectorAll("g.legend-entry").length).toBe(2);
    });

    it("withTooltip initializes tooltip host element", () => {
      createChart(container, config).withTooltip();
      expect(document.body.querySelector("tip-viz-tooltip")).toBeTruthy();
    });

    it("supports method chaining", () => {
      createChart(container, config)
        .withAxes()
        .withGrid()
        .withPoints()
        .withTooltip()
        .withTitle({ title: "Revenue" })
        .withLegend({
          items: [
            { color: "steelblue", label: "Revenue" },
            { color: "tomato", label: "Cost" },
          ],
        });

      expect(container.querySelector("g.x-axis")).toBeTruthy();
      expect(container.querySelector("line.grid-x")).toBeTruthy();
      expect(container.querySelector("circle.point")).toBeTruthy();
      expect(container.querySelector("text.chart-title")?.textContent).toBe("Revenue");
      expect(container.querySelector("g.legend")).toBeTruthy();
    });

    it("supports equivalent option objects without reconfiguration issues", () => {
      const chart = createChart(container, config);
      chart.withTitle({ title: "Revenue" });
      chart.withTitle({ title: "Revenue" });

      chart.withLegend({
        items: [
          { color: "steelblue", label: "Revenue" },
          { color: "tomato", label: "Cost" },
        ],
      });
      chart.withLegend({
        items: [
          { color: "steelblue", label: "Revenue" },
          { color: "tomato", label: "Cost" },
        ],
      });

      expect(container.querySelector("text.chart-title")?.textContent).toBe("Revenue");
      expect(container.querySelectorAll("g.legend-entry").length).toBe(2);
    });
  });

  describe("lifecycle", () => {
    it("update re-renders with new data", () => {
      const chart = createChart(container, config).withPoints();
      const initialCircles = container.querySelectorAll("circle.point").length;
      expect(initialCircles).toBe(data.length * 2);

      chart.update([
        { date: new Date("2023-02-01"), revenue: 200, cost: 30 },
        { date: new Date("2023-02-02"), revenue: 180, cost: 25 },
      ]);

      const updatedCircles = container.querySelectorAll("circle.point").length;
      expect(updatedCircles).toBe(4);
    });

    it("dispose disconnects safely", () => {
      const chart = createChart(container, config).withAxes().withGrid();
      expect(() => chart.dispose()).not.toThrow();
      expect(() => chart.dispose()).not.toThrow();
    });

    it("update throws after dispose", () => {
      const chart = createChart(container, config);
      chart.dispose();
      expect(() => chart.update(data)).toThrow("disposed");
    });
  });

  describe("theme override", () => {
    it("custom background color is applied as a CSS var", () => {
      createChart(container, config, {
        theme: { colors: { ...defaultTheme.colors, background: "#ff0000" } },
      });
      expect(container.style.getPropertyValue("--vl-background")).toBe("#ff0000");
    });

    it("reducedMotion theme is accepted and renders without error", () => {
      const instance = createChart(container, config, {
        theme: reducedMotionTheme,
      });
      expect(instance.series.length).toBe(2);
    });
  });
});
