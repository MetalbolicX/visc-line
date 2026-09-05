import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { ChartConfig } from "../../types/index.mjs";
import { createChart } from "../createChart.mjs";

interface TestData {
  date: Date;
  value: number;
}

const data: TestData[] = [
  { date: new Date("2020-01-01"), value: 10 },
  { date: new Date("2020-02-01"), value: 20 },
];

const config: ChartConfig<TestData> = {
  data,
  xSerie: { accessor: (d) => d.date, label: "Date" },
  ySeries: [{ accessor: (d) => d.value, label: "Value" }],
};

describe("a11y options", () => {
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

  it("sets aria-label on the SVG when ariaLabel is provided", () => {
    const chart = createChart(container, config, {
      ariaLabel: "Monthly revenue, 2020–2024",
    });
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute("aria-label")).toBe("Monthly revenue, 2020–2024");
    expect(svg!.getAttribute("aria-hidden")).toBeNull();
    chart.dispose();
  });

  it("sets default aria-label when no ariaLabel is provided", () => {
    const chart = createChart(container, config);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute("aria-label")).toBe("Interactive line chart");
    expect(svg!.getAttribute("aria-hidden")).toBeNull();
    chart.dispose();
  });

  it("renders x-axis label text from xLabel option when withAxes is called", () => {
    const chart = createChart(container, config, { xLabel: "Month" });
    chart.withAxes();
    const label = container.querySelector("text.x-axis-label");
    expect(label).not.toBeNull();
    expect(label!.textContent).toBe("Month");
    chart.dispose();
  });
});
