import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { ChartConfig } from "../../types/index.mjs";
import { createChart } from "../createChart.mjs";

interface TestData {
  date: Date;
  revenue: number;
  cost: number;
  profit: number;
}

const data: TestData[] = [
  { date: new Date("2023-01-01"), revenue: 100, cost: 10, profit: 90 },
  { date: new Date("2023-01-02"), revenue: 120, cost: 15, profit: 105 },
  { date: new Date("2023-01-03"), revenue: 90, cost: 12, profit: 78 },
  { date: new Date("2023-01-04"), revenue: 150, cost: 20, profit: 130 },
];

const config: ChartConfig<TestData> = {
  data,
  xSerie: { accessor: (d: TestData) => d.date, label: "Date" },
  ySeries: [
    { accessor: (d: TestData) => d.revenue, label: "Revenue" },
    { accessor: (d: TestData) => d.cost, label: "Cost" },
    { accessor: (d: TestData) => d.profit, label: "Profit" },
  ],
};

const twoSeriesConfig: ChartConfig<TestData> = {
  data,
  xSerie: { accessor: (d: TestData) => d.date, label: "Date" },
  ySeries: [
    { accessor: (d: TestData) => d.revenue, label: "Revenue" },
    { accessor: (d: TestData) => d.cost, label: "Cost" },
  ],
};

describe("focus", () => {
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

  describe("withFocus", () => {
    it("dims non-focused series path to dimOpacity", () => {
      createChart(container, twoSeriesConfig).withFocus("Revenue");
      const revenuePath = container.querySelector<SVGPathElement>("path.chart-line--Revenue");
      const costPath = container.querySelector<SVGPathElement>("path.chart-line--Cost");
      // Revenue is focused → full opacity (via CSS variable default)
      expect(revenuePath?.getAttribute("opacity")).not.toBe("0.25");
      // Cost is dimmed → dimOpacity value
      expect(costPath?.getAttribute("opacity")).toBe("0.25");
    });

    it("withFocus(null) restores full opacity to all series", () => {
      const chart = createChart(container, twoSeriesConfig);
      chart.withFocus("Revenue");
      chart.withFocus(null);
      const revenuePath = container.querySelector<SVGPathElement>("path.chart-line--Revenue");
      const costPath = container.querySelector<SVGPathElement>("path.chart-line--Cost");
      expect(revenuePath?.getAttribute("opacity")).not.toBe("0.25");
      expect(costPath?.getAttribute("opacity")).not.toBe("0.25");
    });

    it("withFocus with multiple labels dims only the non-focused series", () => {
      createChart(container, config).withFocus(["Revenue", "Cost"]);
      const revenuePath = container.querySelector<SVGPathElement>("path.chart-line--Revenue");
      const costPath = container.querySelector<SVGPathElement>("path.chart-line--Cost");
      const profitPath = container.querySelector<SVGPathElement>("path.chart-line--Profit");
      expect(revenuePath?.getAttribute("opacity")).not.toBe("0.25");
      expect(costPath?.getAttribute("opacity")).not.toBe("0.25");
      expect(profitPath?.getAttribute("opacity")).toBe("0.25");
    });

    it("throws on unknown focus label listing valid labels", () => {
      const chart = createChart(container, twoSeriesConfig);
      expect(() => chart.withFocus("Nope")).toThrow("Unknown series labels");
      expect(() => chart.withFocus("Nope")).toThrow("Revenue");
      expect(() => chart.withFocus("Nope")).toThrow("Cost");
    });

    it("focus persists across update()", () => {
      const chart = createChart(container, twoSeriesConfig);
      chart.withFocus("Revenue");
      chart.update([
        { date: new Date("2023-02-01"), revenue: 200, cost: 30, profit: 170 },
        { date: new Date("2023-02-02"), revenue: 180, cost: 25, profit: 155 },
      ]);
      const costPath = container.querySelector<SVGPathElement>("path.chart-line--Cost");
      expect(costPath?.getAttribute("opacity")).toBe("0.25");
    });

    it("updateVisibleSeries narrows focused set without throwing", () => {
      const chart = createChart(container, config);
      chart.withFocus("Revenue");
      // A is hidden; Revenue was focused but is now hidden → no throw, Profit (not focused) is visible and dimmed
      chart.updateVisibleSeries(["Profit"]);
      const profitPath = container.querySelector<SVGPathElement>("path.chart-line--Profit");
      expect(profitPath).toBeTruthy();
      expect(profitPath?.getAttribute("opacity")).toBe("0.25");
    });
  });
});
