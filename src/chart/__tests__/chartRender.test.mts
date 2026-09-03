import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { ChartConfig } from "../../types/index.mjs";
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

describe("chartRender", () => {
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

  describe("full-feature render (all .with*() calls)", () => {
    it("renders svg root element", () => {
      createChart(container, config)
        .withAxes()
        .withGrid()
        .withPoints()
        .withTitle({ title: "Revenue" })
        .withLegend({});
      const svg = container.querySelector("svg");
      expect(svg).toBeTruthy();
    });

    it("renders bounds group translated by margins", () => {
      createChart(container, config)
        .withAxes()
        .withGrid();
      const bounds = container.querySelector("g.bounds");
      expect(bounds).toBeTruthy();
      // Default margins produce a translate transform
      const transform = bounds?.getAttribute("transform");
      expect(transform).toBeTruthy();
      expect(transform?.startsWith("translate(")).toBe(true);
    });

    it("content group has clip-path attribute referencing a clip URL", () => {
      createChart(container, config);
      const content = container.querySelector("g.content");
      expect(content).toBeTruthy();
      const clipPath = content?.getAttribute("clip-path");
      expect(clipPath).toBeTruthy();
      // Pin what the code does: clip-path references a clip URL
      expect(clipPath?.includes("url(")).toBe(true);
    });

    it("renders path for each line with non-empty d attribute starting with M", () => {
      createChart(container, config)
        .withAxes()
        .withGrid();
      const lines = container.querySelectorAll("g.content path.chart-line");
      expect(lines.length).toBe(2);
      lines.forEach((line) => {
        const d = line.getAttribute("d");
        expect(d).toBeTruthy();
        expect(d?.trim().startsWith("M")).toBe(true);
        expect(d!.length).toBeGreaterThan(1);
      });
    });

    it("renders points when withPoints is called", () => {
      createChart(container, config)
        .withPoints();
      const points = container.querySelectorAll("g.content circle.point");
      expect(points.length).toBeGreaterThan(0);
    });

    it("renders title when withTitle is called", () => {
      createChart(container, config)
        .withTitle({ title: "My Chart" });
      const title = container.querySelector("text.chart-title");
      expect(title).toBeTruthy();
      expect(title?.textContent).toBe("My Chart");
    });

    it("renders x-axis and y-axis when withAxes is called", () => {
      createChart(container, config)
        .withAxes();
      const xAxis = container.querySelector("g.bounds > g.x-axis");
      const yAxis = container.querySelector("g.bounds > g.y-axis");
      expect(xAxis).toBeTruthy();
      expect(yAxis).toBeTruthy();
    });

    it("renders axis labels when withAxes is called", () => {
      createChart(container, config)
        .withAxes();
      const xLabel = container.querySelector("text.x-axis-label");
      const yLabel = container.querySelector("text.y-axis-label");
      expect(xLabel).toBeTruthy();
      expect(yLabel).toBeTruthy();
    });

    it("renders x-grid and y-grid when withGrid is called", () => {
      createChart(container, config)
        .withGrid();
      const gridX = container.querySelectorAll("line.grid-x");
      const gridY = container.querySelectorAll("line.grid-y");
      expect(gridX.length).toBeGreaterThan(0);
      expect(gridY.length).toBeGreaterThan(0);
    });

    // ---- full-feature render end ----
  });

  describe("minimal render (no .with*() calls)", () => {
    it("renders line path", () => {
      createChart(container, config);
      const lines = container.querySelectorAll("g.content path.chart-line");
      expect(lines.length).toBe(2);
    });

    it("does NOT render axis groups", () => {
      createChart(container, config);
      expect(container.querySelector("g.bounds > g.x-axis")).toBeNull();
      expect(container.querySelector("g.bounds > g.y-axis")).toBeNull();
    });

    it("does NOT render axis label text", () => {
      createChart(container, config);
      expect(container.querySelector("text.x-axis-label")).toBeNull();
      expect(container.querySelector("text.y-axis-label")).toBeNull();
    });

    it("does NOT render title", () => {
      createChart(container, config);
      expect(container.querySelector("text.chart-title")).toBeNull();
    });

    it("does NOT render grid lines", () => {
      createChart(container, config);
      expect(container.querySelector("line.grid-x")).toBeNull();
      expect(container.querySelector("line.grid-y")).toBeNull();
    });

    it("does NOT render legend", () => {
      createChart(container, config);
      expect(container.querySelector("g.legend")).toBeNull();
    });

    it("does NOT render points", () => {
      createChart(container, config);
      expect(container.querySelector("circle.point")).toBeNull();
    });
    // ---- minimal render end ----
  });

  describe("idempotent re-render", () => {
    it("calling same builder twice does not duplicate svg", () => {
      const chart = createChart(container, config)
        .withAxes()
        .withGrid();
      chart.withAxes().withGrid();
      const svgs = container.querySelectorAll("svg");
      expect(svgs.length).toBe(1);
    });

    it("calling same builder twice does not duplicate line paths", () => {
      const chart = createChart(container, config);
      chart.update(data);
      const lines = container.querySelectorAll("g.content path.chart-line");
      expect(lines.length).toBe(2);
    });

    it("calling same builder twice does not duplicate axis groups", () => {
      const chart = createChart(container, config)
        .withAxes();
      chart.withAxes();
      const xAxes = container.querySelectorAll("g.bounds > g.x-axis");
      const yAxes = container.querySelectorAll("g.bounds > g.y-axis");
      expect(xAxes.length).toBe(1);
      expect(yAxes.length).toBe(1);
    });

    it("update with identical data does not grow element counts", () => {
      const chart = createChart(container, config)
        .withAxes()
        .withPoints();
      const initialLines = container.querySelectorAll("g.content path.chart-line").length;
      const initialPoints = container.querySelectorAll("circle.point").length;
      const initialXAxes = container.querySelectorAll("g.x-axis").length;

      chart.update(data);

      expect(container.querySelectorAll("g.content path.chart-line").length).toBe(initialLines);
      expect(container.querySelectorAll("circle.point").length).toBe(initialPoints);
      expect(container.querySelectorAll("g.x-axis").length).toBe(initialXAxes);
    });
    // ---- idempotent re-render end ----
  });

  describe("known bugs (plan references)", () => {
    // BUG: empty data produces NaN in scales (plan 004)
    it.todo("BUG: empty data array produces NaN scale domain (fixed by plan 004)");

    // BUG: tooltip listeners may accumulate on re-render (plan 005)
    it.todo("BUG: tooltip listener leak on re-render (fixed by plan 005)");

    // BUG: zoom extent ignores margins when clamping (plan 008)
    it.todo("BUG: zoom extent margins not respected (fixed by plan 008)");
  });
});
