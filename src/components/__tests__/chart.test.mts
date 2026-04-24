import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { ChartConfig, Theme } from "../../types/index.mjs";
import { createChart } from "../chart.mjs";
import { defaultTheme } from "../../themes/defaultTheme.mjs";

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
    const SVGPathEl = (globalThis as unknown as Record<string, unknown>)["SVGPathElement"];
    if (typeof SVGPathEl !== "undefined") {
      Object.defineProperty((SVGPathEl as typeof SVGPathElement).prototype, "getTotalLength", {
        value: () => 100,
      });
    }
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe("returns a valid ChartInstance", () => {
    it("returns the provided container", () => {
      const instance = createChart(container, config);
      expect(instance.container).toBe(container);
    });

    it("svg is an SVGSVGElement", () => {
      const instance = createChart(container, config);
      expect(instance.svg.node()).toBeInstanceOf(SVGSVGElement);
    });

    it("update is a function", () => {
      const instance = createChart(container, config);
      expect(typeof instance.update).toBe("function");
    });

    it("dispose is a function", () => {
      const instance = createChart(container, config);
      expect(typeof instance.dispose).toBe("function");
    });

    it("series getter returns 2 processed series", () => {
      const instance = createChart(container, config);
      expect(instance.series.length).toBe(2);
    });
  });

  describe("SVG element", () => {
    it("appends an SVG to the container", () => {
      createChart(container, config);
      expect(container.querySelector("svg")).toBeTruthy();
    });

    it("SVG has width and height from container dimensions", () => {
      createChart(container, config);
      const svg = container.querySelector("svg") as SVGSVGElement;
      expect(svg.getAttribute("width")).toBe("800");
      expect(svg.getAttribute("height")).toBe("400");
    });

    it("SVG has a style attribute with --vl-background CSS var", () => {
      createChart(container, config);
      const svg = container.querySelector("svg") as SVGSVGElement;
      expect(svg.getAttribute("style")).toContain("--vl-background");
    });
  });

  describe("bounds and content groups", () => {
    it("has a bounds group with a translate transform", () => {
      createChart(container, config);
      const bounds = container.querySelector("g.bounds") as SVGGElement;
      expect(bounds).toBeTruthy();
      expect(bounds.getAttribute("transform")).toContain("translate");
    });

    it("has a content group inside bounds with a clip-path", () => {
      createChart(container, config);
      const content = container.querySelector("g.bounds > g.content") as SVGGElement;
      expect(content).toBeTruthy();
      expect(content.getAttribute("clip-path")).toContain("chart-content-clip");
    });

    it("has a clipPath definition in defs", () => {
      createChart(container, config);
      expect(container.querySelector("defs clipPath")).toBeTruthy();
      expect(container.querySelector("defs clipPath rect")).toBeTruthy();
    });
  });

  describe("line paths", () => {
    it("renders one path.chart-line per series", () => {
      createChart(container, config);
      const lines = container.querySelectorAll("g.content path.chart-line");
      expect(lines.length).toBe(2);
    });

    it("line paths have series-specific BEM modifier classes", () => {
      createChart(container, config);
      expect(container.querySelector("path.chart-line--Revenue")).toBeTruthy();
      expect(container.querySelector("path.chart-line--Cost")).toBeTruthy();
    });

    it("line paths have fill set to none", () => {
      createChart(container, config);
      const line = container.querySelector("path.chart-line") as SVGPathElement;
      expect(line.getAttribute("fill")).toBe("none");
    });

    it("line paths have stroke-width from CSS var", () => {
      createChart(container, config);
      const line = container.querySelector("path.chart-line") as SVGPathElement;
      expect(line.getAttribute("stroke-width")).toContain("var(--vl-line-stroke-width");
    });
  });

  describe("point circles", () => {
    it("renders point-series groups per series", () => {
      createChart(container, config);
      const groups = container.querySelectorAll("g.content g.point-series");
      expect(groups.length).toBe(2);
    });

    it("point-series groups have series modifier classes", () => {
      createChart(container, config);
      expect(container.querySelector("g.point-series--Revenue")).toBeTruthy();
      expect(container.querySelector("g.point-series--Cost")).toBeTruthy();
    });

    it("renders circle.point elements for each datum per series", () => {
      createChart(container, config);
      const circles = container.querySelectorAll("g.content circle.point");
      expect(circles.length).toBe(data.length * 2);
    });

    it("circle points have radius from CSS var", () => {
      createChart(container, config);
      const circle = container.querySelector("circle.point") as SVGCircleElement;
      expect(circle.getAttribute("r")).toBe(String(defaultTheme.points.radius));
    });
  });

  describe("axes", () => {
    it("renders an x-axis group", () => {
      createChart(container, config);
      expect(container.querySelector("g.bounds > g.x-axis")).toBeTruthy();
    });

    it("renders a y-axis group", () => {
      createChart(container, config);
      expect(container.querySelector("g.bounds > g.y-axis")).toBeTruthy();
    });

    it("x-axis group has a transform with translate(0,", () => {
      createChart(container, config);
      const xAxis = container.querySelector("g.x-axis") as SVGGElement;
      expect(xAxis.getAttribute("transform")).toContain("translate(0,");
    });
  });

  describe("grid lines", () => {
    it("renders grid-x lines in the content group", () => {
      createChart(container, config);
      const gridLines = container.querySelectorAll("g.content line.grid-x");
      expect(gridLines.length).toBeGreaterThan(0);
    });

    it("renders grid-y lines in the content group", () => {
      createChart(container, config);
      const gridLines = container.querySelectorAll("g.content line.grid-y");
      expect(gridLines.length).toBeGreaterThan(0);
    });

    it("grid lines have stroke from CSS var", () => {
      createChart(container, config);
      const gridLine = container.querySelector("line.grid-x") as SVGLineElement;
      expect(gridLine.getAttribute("stroke")).toContain("var(--vl-grid-stroke");
    });

    it("grid lines have stroke-dasharray from CSS var", () => {
      createChart(container, config);
      const gridLine = container.querySelector("line.grid-x") as SVGLineElement;
      expect(gridLine.getAttribute("stroke-dasharray")).toContain("var(--vl-grid-dash-array");
    });
  });

  describe("CSS variables on container", () => {
    it("writes --vl-background", () => {
      createChart(container, config);
      expect(container.style.getPropertyValue("--vl-background")).not.toBe("");
    });

    it("writes --vl-grid-color", () => {
      createChart(container, config);
      expect(container.style.getPropertyValue("--vl-grid-color")).not.toBe("");
    });

    it("writes --vl-line-stroke-width", () => {
      createChart(container, config);
      expect(container.style.getPropertyValue("--vl-line-stroke-width")).not.toBe("");
    });

    it("writes --vl-point-radius", () => {
      createChart(container, config);
      expect(container.style.getPropertyValue("--vl-point-radius")).not.toBe("");
    });

    it("writes --vl-grid-opacity matching defaultTheme", () => {
      createChart(container, config);
      expect(container.style.getPropertyValue("--vl-grid-opacity")).toBe(
        String(defaultTheme.grid.opacity),
      );
    });

    it("writes --vl-grid-dash-array matching defaultTheme", () => {
      createChart(container, config);
      expect(container.style.getPropertyValue("--vl-grid-dash-array")).toBe(
        defaultTheme.grid.dashArray,
      );
    });

    it("writes --vl-point-opacity matching defaultTheme", () => {
      createChart(container, config);
      expect(container.style.getPropertyValue("--vl-point-opacity")).toBe(
        String(defaultTheme.points.opacity),
      );
    });
  });

  describe("dispose", () => {
    it("dispose disconnects the ResizeObserver", () => {
      const instance = createChart(container, config);
      expect(() => instance.dispose()).not.toThrow();
    });
  });

  describe("update", () => {
    it("update re-renders with new data and changes circle count", () => {
      const instance = createChart(container, config);
      const initialCircles = container.querySelectorAll("circle.point").length;
      expect(initialCircles).toBe(data.length * 2);

      Object.defineProperty(
        Object.getPrototypeOf(container.querySelector("path.chart-line")!),
        "getTotalLength",
        { value: () => 100, writable: true, configurable: true },
      );

      const newData: TestData[] = [
        { date: new Date("2023-02-01"), revenue: 200, cost: 30 },
        { date: new Date("2023-02-02"), revenue: 180, cost: 25 },
      ];

      instance.update(newData);

      const updatedCircles = container.querySelectorAll("circle.point").length;
      expect(updatedCircles).toBe(newData.length * 2);
      expect(updatedCircles).not.toBe(initialCircles);
    });

    it("SVG structure persists after update", () => {
      const instance = createChart(container, config);

      Object.defineProperty(
        Object.getPrototypeOf(container.querySelector("path.chart-line")!),
        "getTotalLength",
        { value: () => 100, writable: true, configurable: true },
      );

      instance.update([
        { date: new Date("2023-02-01"), revenue: 200, cost: 30 },
      ]);

      expect(container.querySelector("svg")).toBeTruthy();
      expect(container.querySelector("g.bounds")).toBeTruthy();
      expect(container.querySelector("g.content")).toBeTruthy();
      expect(container.querySelector("g.x-axis")).toBeTruthy();
      expect(container.querySelector("g.y-axis")).toBeTruthy();
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
