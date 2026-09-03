import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ChartConfig } from "../../types/index.mjs";
import { createChart } from "../createChart.mjs";

interface TestData {
  date: Date;
  revenue: number;
  cost: number;
}

const baseConfig: ChartConfig<TestData> = {
  data: [],
  xSerie: { accessor: (d: TestData) => d.date, label: "Date" },
  ySeries: [
    { accessor: (d: TestData) => d.revenue, label: "Revenue" },
    { accessor: (d: TestData) => d.cost, label: "Cost" },
  ],
};

const fullConfig: ChartConfig<TestData> = {
  data: [
    { date: new Date("2023-01-01"), revenue: 100, cost: 10 },
    { date: new Date("2023-01-02"), revenue: 120, cost: 15 },
    { date: new Date("2023-01-03"), revenue: 90, cost: 12 },
  ],
  xSerie: { accessor: (d: TestData) => d.date, label: "Date" },
  ySeries: [
    { accessor: (d: TestData) => d.revenue, label: "Revenue" },
    { accessor: (d: TestData) => d.cost, label: "Cost" },
  ],
};

describe("renderChart — empty-data guard", () => {
  let container: HTMLElement;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    container = document.createElement("div");
    Object.defineProperty(container, "clientWidth", { value: 800 });
    Object.defineProperty(container, "clientHeight", { value: 400 });
    document.body.appendChild(container);
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

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
    warnSpy?.mockRestore();
    if (container.parentNode) container.parentNode.removeChild(container);
  });

  it("renders SVG without NaN when data is an empty array", () => {
    const instance = createChart(container, baseConfig);
    void instance;
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    const html = container.innerHTML;
    // NaN appears as literal string "NaN" in SVG attributes
    expect(html).not.toContain("NaN");
  });

  it("warns once when data is an empty array", async () => {
    const instance = createChart(container, baseConfig);
    void instance;
    await new Promise((r) => requestAnimationFrame(r));
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toMatch(/empty|invalid/);
  });

  it("renders SVG without NaN when all y accessors return NaN", () => {
    const allNaNConfig: ChartConfig<TestData> = {
      data: [
        { date: new Date("2023-01-01"), revenue: NaN, cost: NaN },
        { date: new Date("2023-01-02"), revenue: NaN, cost: NaN },
      ],
      xSerie: { accessor: (d: TestData) => d.date, label: "Date" },
      ySeries: [
        { accessor: (d: TestData) => d.revenue, label: "Revenue" },
        { accessor: (d: TestData) => d.cost, label: "Cost" },
      ],
    };
    const instance = createChart(container, allNaNConfig);
    void instance;
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    const html = container.innerHTML;
    expect(html).not.toContain("NaN");
  });

  it("warns once when all y accessors return NaN", async () => {
    const allNaNConfig: ChartConfig<TestData> = {
      data: [
        { date: new Date("2023-01-01"), revenue: NaN, cost: NaN },
        { date: new Date("2023-01-02"), revenue: NaN, cost: NaN },
      ],
      xSerie: { accessor: (d: TestData) => d.date, label: "Date" },
      ySeries: [
        { accessor: (d: TestData) => d.revenue, label: "Revenue" },
        { accessor: (d: TestData) => d.cost, label: "Cost" },
      ],
    };
    const instance = createChart(container, allNaNConfig);
    void instance;
    await new Promise((r) => requestAnimationFrame(r));
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toMatch(/empty|invalid/);
  });

  it("renders a single-point data series without NaN", () => {
    const singlePointConfig: ChartConfig<TestData> = {
      data: [{ date: new Date("2023-01-01"), revenue: 42, cost: 7 }],
      xSerie: { accessor: (d: TestData) => d.date, label: "Date" },
      ySeries: [
        { accessor: (d: TestData) => d.revenue, label: "Revenue" },
        { accessor: (d: TestData) => d.cost, label: "Cost" },
      ],
    };
    const instance = createChart(container, singlePointConfig);
    void instance;
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    const html = container.innerHTML;
    expect(html).not.toContain("NaN");
  });

  it("warns once when all series have NaN y values (mixed with valid x)", async () => {
    const mixedNaNConfig: ChartConfig<TestData> = {
      data: [
        { date: new Date("2023-01-01"), revenue: 100, cost: NaN },
        { date: new Date("2023-01-02"), revenue: NaN, cost: 15 },
      ],
      xSerie: { accessor: (d: TestData) => d.date, label: "Date" },
      ySeries: [
        { accessor: (d: TestData) => d.revenue, label: "Revenue" },
        { accessor: (d: TestData) => d.cost, label: "Cost" },
      ],
    };
    const instance = createChart(container, mixedNaNConfig);
    void instance;
    await new Promise((r) => requestAnimationFrame(r));
    const html = container.innerHTML;
    expect(html).not.toContain("NaN");
  });
});
