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

    it("exposes allSeries and series with all visible by default", () => {
      const chart = createChart(container, config);
      expect(chart.allSeries.length).toBe(2);
      expect(chart.series.length).toBe(2);
    });
  });

  describe("builder methods", () => {
    it("with methods return stable chart instance", () => {
      const chart = createChart(container, config);
      expect(chart.withAxes()).toBe(chart);
      expect(chart.withGrid()).toBe(chart);
      expect(chart.withPoints()).toBe(chart);
      expect(chart.withVisibleSeries(["Revenue"])).toBe(chart);
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

    it("withGrid supports directional toggles", () => {
      createChart(container, config).withGrid({ showX: true, showY: false });
      expect(container.querySelector("line.grid-x")).toBeTruthy();
      expect(container.querySelector("line.grid-y")).toBeNull();
    });

    it("withGrid allows disabling both directions", () => {
      createChart(container, config).withGrid({ showX: false, showY: false });
      expect(container.querySelector("line.grid-x")).toBeNull();
      expect(container.querySelector("line.grid-y")).toBeNull();
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

    it("withLegend auto-derives items from series when items is omitted", () => {
      createChart(container, config).withLegend({});
      expect(container.querySelector("g.legend")).toBeTruthy();
      const entries = container.querySelectorAll("g.legend-entry");
      expect(entries.length).toBe(2);
      expect(entries[0]?.getAttribute("data-label")).toBe("Revenue");
      expect(entries[1]?.getAttribute("data-label")).toBe("Cost");
    });

    it("withLegend auto-derived items use palette colors when stroke is omitted", () => {
      createChart(container, config).withLegend({});
      const swatches = container.querySelectorAll("rect.swatch");
      expect(swatches[0]?.getAttribute("fill")).toBe("var(--vl-palette-0, steelblue)");
      expect(swatches[1]?.getAttribute("fill")).toBe("var(--vl-palette-1, steelblue)");
    });

    it("withLegend auto-derived items use stroke when series has explicit color", () => {
      const configWithStroke: ChartConfig<TestData> = {
        data,
        xSerie: { accessor: (d) => d.date, label: "Date" },
        ySeries: [
          { accessor: (d) => d.revenue, label: "Revenue", stroke: "#e74c3c" },
          { accessor: (d) => d.cost, label: "Cost" },
        ],
      };
      createChart(container, configWithStroke).withLegend({});
      const swatches = container.querySelectorAll("rect.swatch");
      expect(swatches[0]?.getAttribute("fill")).toBe("#e74c3c");
      expect(swatches[1]?.getAttribute("fill")).toBe("var(--vl-palette-1, steelblue)");
    });

    it("withLegend auto-derived interactive emits toggles", () => {
      const calls: Array<{ label: string; isVisible: boolean }> = [];
      createChart(container, config)
        .withVisibleSeries(["Revenue"])
        .withLegend({
          interactive: true,
          onToggle: (label, isVisible) => {
            calls.push({ isVisible, label });
          },
        });

      const hiddenEntry = container.querySelector<SVGGElement>('g.legend-entry[data-label="Cost"]');
      hiddenEntry?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(calls).toEqual([{ isVisible: true, label: "Cost" }]);
    });

    it("withLegend equivalent auto-derived options skip reconfiguration", () => {
      const chart = createChart(container, config);
      chart.withLegend({});
      chart.withLegend({});
      expect(container.querySelectorAll("g.legend-entry").length).toBe(2);
    });

    it("withTooltip initializes tooltip host element", () => {
      createChart(container, config).withTooltip();
      expect(document.body.querySelector("tip-viz-tooltip")).toBeTruthy();
    });

    it("withAxes forwards tick options", () => {
      createChart(container, config).withAxes({
        xTickCount: 7,
        yTickCount: 3,
      });
      const xTicks = container.querySelectorAll("g.x-axis g.tick");
      const yTicks = container.querySelectorAll("g.y-axis g.tick");
      expect(xTicks.length).toBeGreaterThan(0);
      expect(yTicks.length).toBeGreaterThan(0);
    });

    it("withTooltip accepts tooltipHtml option", () => {
      createChart(container, config).withTooltip({
        tooltipHtml: ({ xLabel }) => `<div>${xLabel}</div>`,
      });
      expect(document.body.querySelector("tip-viz-tooltip")).toBeTruthy();
    });

    it("withZoomPan enables zoom behavior", () => {
      createChart(container, config).withZoomPan();
      // Zoom behavior attaches to the SVG — verify it's present
      const svg = container.querySelector("svg");
      expect(svg).toBeTruthy();
    });

    it("withZoomPan accepts custom scaleExtent", () => {
      createChart(container, config).withZoomPan({ scaleExtent: [1, 10] });
      const svg = container.querySelector("svg");
      expect(svg).toBeTruthy();
    });

    it("supports method chaining", () => {
      createChart(container, config)
        .withVisibleSeries(["Revenue", "Cost"])
        .withAxes()
        .withGrid()
        .withPoints()
        .withTooltip()
        .withTitle({ title: "Revenue" })
        .withLegend({});

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

    it("withVisibleSeries renders only selected series", () => {
      createChart(container, config).withVisibleSeries(["Revenue"]);
      const lines = container.querySelectorAll("g.content path.chart-line");
      expect(lines.length).toBe(1);
      expect(lines[0]?.getAttribute("class")?.includes("Revenue")).toBe(true);
    });

    it("withVisibleSeries accepts empty list and renders empty plot", () => {
      const chart = createChart(container, config).withPoints().withVisibleSeries([]);
      expect(chart.series.length).toBe(0);
      expect(chart.allSeries.length).toBe(2);
      expect(container.querySelectorAll("g.content path.chart-line").length).toBe(0);
      expect(container.querySelectorAll("g.content circle.point").length).toBe(0);
    });

    it("withVisibleSeries throws on unknown label", () => {
      const chart = createChart(container, config);
      expect(() => chart.withVisibleSeries(["Unknown"])).toThrow("Unknown series labels");
    });

    it("withLegend interactive emits toggles", () => {
      const calls: Array<{ label: string; isVisible: boolean }> = [];
      createChart(container, config)
        .withVisibleSeries(["Revenue"])
        .withLegend({
          interactive: true,
          items: [
            { color: "steelblue", label: "Revenue" },
            { color: "tomato", label: "Cost" },
          ],
          onToggle: (label, isVisible) => {
            calls.push({ isVisible, label });
          },
        });

      const hiddenEntry = container.querySelector<SVGGElement>('g.legend-entry[data-label="Cost"]');
      hiddenEntry?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(calls).toEqual([{ isVisible: true, label: "Cost" }]);
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

    it("update resets the zoom transform to identity", () => {
      const chart = createChart(container, config).withZoomPan();
      const zoomBehavior = chart.zoomBehavior;
      expect(zoomBehavior).not.toBeNull();

      // Apply a non-identity transform by replacing the transform property with a
      // function that returns a scaled zoom transform.
      // d3 zoom uses transform(svgNode) to get current transform, and transform(svgNode, newTransform) to set it.
      let currentK = 2; // simulate zoomed-in state
      const fakeTransform = (
        node: unknown,
        t?: unknown,
      ): { k: number; x: number; y: number } => {
        if (t !== undefined) {
          const transform = t as { k: number; x: number; y: number };
          currentK = transform.k;
          return transform;
        }
        return { k: currentK, x: 0, y: 0 };
      };

      Object.defineProperty(zoomBehavior!, "transform", {
        value: fakeTransform,
        writable: true,
        configurable: true,
      });

      expect(fakeTransform(undefined)).toMatchObject({ k: 2 });

      chart.update([
        { date: new Date("2023-04-01"), revenue: 400, cost: 50 },
        { date: new Date("2023-04-02"), revenue: 450, cost: 55 },
      ]);

      // After update(), zoom should be reset to identity (k=1)
      expect(fakeTransform(undefined)).toMatchObject({ k: 1 });
    });

    it("update keeps visible series selection", () => {
      const chart = createChart(container, config)
        .withPoints()
        .withVisibleSeries(["Revenue"]);

      expect(chart.series.length).toBe(1);
      expect(container.querySelectorAll("g.content path.chart-line").length).toBe(1);

      chart.update([
        { date: new Date("2023-03-01"), revenue: 300, cost: 40 },
        { date: new Date("2023-03-02"), revenue: 250, cost: 35 },
      ]);

      expect(chart.allSeries.length).toBe(2);
      expect(chart.series.length).toBe(1);
      expect(container.querySelectorAll("g.content path.chart-line").length).toBe(1);
      expect(container.querySelectorAll("g.content circle.point").length).toBe(2);
    });

    it("updateVisibleSeries updates rendered series", () => {
      const chart = createChart(container, config).withVisibleSeries(["Revenue"]);
      expect(container.querySelectorAll("g.content path.chart-line").length).toBe(1);

      chart.updateVisibleSeries(["Cost"]);
      expect(chart.series.length).toBe(1);
      expect(chart.series[0]?.label).toBe("Cost");
      expect(container.querySelectorAll("g.content path.chart-line").length).toBe(1);
    });

    it("updateVisibleSeries throws on unknown labels", () => {
      const chart = createChart(container, config);
      expect(() => chart.updateVisibleSeries(["Nope"])).toThrow("Unknown series labels");
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

    it("updateVisibleSeries throws after dispose", () => {
      const chart = createChart(container, config);
      chart.dispose();
      expect(() => chart.updateVisibleSeries(["Revenue"]))
        .toThrow("disposed");
    });
  });

  describe("withCustom", () => {
    it("callback runs after render and appends custom DOM", () => {
      createChart(container, config).withCustom((ctx) => {
        ctx.content
          .append("line")
          .attr("class", "custom-line")
          .attr("x1", 0)
          .attr("x2", ctx.dims.innerWidth)
          .attr("y1", ctx.yScale(120))
          .attr("y2", ctx.yScale(120))
          .attr("stroke", "red");
      });

      expect(container.querySelector("line.custom-line")).toBeTruthy();
    });

    it("callback receives correct context properties", () => {
      createChart(container, config).withCustom((ctx) => {
        expect(ctx.svg).toBeDefined();
        expect(ctx.bounds).toBeDefined();
        expect(ctx.content).toBeDefined();
        expect(typeof ctx.xScale).toBe("function");
        expect(typeof ctx.yScale).toBe("function");
        expect(typeof ctx.dims.innerWidth).toBe("number");
        expect(typeof ctx.dims.innerHeight).toBe("number");
      });
    });

    it("cleanup function is called on re-render", () => {
      let cleaned = false;
      const chart = createChart(container, config).withCustom((ctx) => {
        ctx.content
          .append("circle")
          .attr("class", "custom-circle")
          .attr("r", 5);
        return () => {
          cleaned = true;
        };
      });

      chart.withCustom((ctx) => {
        ctx.content
          .append("circle")
          .attr("class", "custom-circle-v2")
          .attr("r", 5);
      });

      expect(cleaned).toBe(true);
    });

    it("last-write-wins: only latest callback's elements exist", () => {
      const chart = createChart(container, config).withCustom((ctx) => {
        ctx.content
          .append("circle")
          .attr("class", "custom-old");
        return () => {
          ctx.content.selectAll("circle.custom-old").remove();
        };
      });

      chart.withCustom((ctx) => {
        ctx.content
          .append("circle")
          .attr("class", "custom-new");
      });

      expect(container.querySelector("circle.custom-old")).toBeNull();
      expect(container.querySelector("circle.custom-new")).toBeTruthy();
    });

    it("withCustom(null) clears callback and runs cleanup", () => {
      let cleaned = false;
      const chart = createChart(container, config).withCustom((ctx) => {
        ctx.content
          .append("circle")
          .attr("class", "custom-dot")
          .attr("r", 3);
        return () => {
          ctx.content.selectAll("circle.custom-dot").remove();
          cleaned = true;
        };
      });

      expect(container.querySelector("circle.custom-dot")).toBeTruthy();
      chart.withCustom(null);
      expect(cleaned).toBe(true);
      expect(container.querySelector("circle.custom-dot")).toBeNull();
    });

    it("cleanup runs on dispose", () => {
      let cleaned = false;
      const chart = createChart(container, config).withCustom((ctx) => {
        ctx.content
          .append("circle")
          .attr("class", "dispose-dot")
          .attr("r", 3);
        return () => {
          cleaned = true;
        };
      });

      chart.dispose();
      expect(cleaned).toBe(true);
    });

    it("withCustom throws on disposed chart", () => {
      const chart = createChart(container, config);
      chart.dispose();
      expect(() => chart.withCustom(() => {})).toThrow("disposed");
    });

    it("withCustom(null) throws on disposed chart", () => {
      const chart = createChart(container, config);
      chart.dispose();
      // withCustom(null) calls ensureActive() internally and will throw too
      expect(() => chart.withCustom(null)).toThrow("disposed");
    });

    it("withCustom short-circuits when called twice with the same callback reference", () => {
      let renderCount = 0;
      const cb = (): (() => void) => {
        renderCount++;
        return () => {};
      };

      const chart = createChart(container, config);
      chart.withCustom(cb);
      expect(renderCount).toBe(1);

      // Calling with the same callback reference should short-circuit and NOT re-render
      chart.withCustom(cb);
      expect(renderCount).toBe(1); // Still 1 — no second render
    });

    it("supports method chaining", () => {
      createChart(container, config)
        .withAxes()
        .withGrid()
        .withCustom((ctx) => {
          ctx.content
            .append("line")
            .attr("class", "chained-line")
            .attr("x1", 0)
            .attr("x2", ctx.dims.innerWidth)
            .attr("y1", ctx.yScale(90))
            .attr("y2", ctx.yScale(90))
            .attr("stroke", "green");
        });

      expect(container.querySelector("g.x-axis")).toBeTruthy();
      expect(container.querySelector("line.grid-x")).toBeTruthy();
      expect(container.querySelector("line.chained-line")).toBeTruthy();
    });

    it("withCustom returns stable chart instance", () => {
      const chart = createChart(container, config);
      expect(chart.withCustom(() => {})).toBe(chart);
    });

    it("custom elements are re-created on update() with fresh scales", () => {
      const chart = createChart(container, config).withCustom((ctx) => {
        ctx.content
          .append("line")
          .attr("class", "update-test-line")
          .attr("x1", 0)
          .attr("x2", ctx.dims.innerWidth)
          .attr("y1", ctx.yScale(120))
          .attr("y2", ctx.yScale(120))
          .attr("stroke", "purple");
        return () => {
          ctx.content.selectAll("line.update-test-line").remove();
        };
      });

      const initialLines = container.querySelectorAll("line.update-test-line").length;
      expect(initialLines).toBe(1);

      chart.update([
        { date: new Date("2023-06-01"), revenue: 500, cost: 50 },
        { date: new Date("2023-06-02"), revenue: 600, cost: 60 },
      ]);

      const updatedLines = container.querySelectorAll("line.update-test-line").length;
      expect(updatedLines).toBe(1);
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

  describe("validation", () => {
    it("throws when ySeries labels are duplicated", () => {
      const duplicatedConfig: ChartConfig<TestData> = {
        ...config,
        ySeries: [
          { accessor: (d) => d.revenue, label: "Revenue" },
          { accessor: (d) => d.cost, label: "Revenue" },
        ],
      };

      expect(() => createChart(container, duplicatedConfig))
        .toThrow("duplicated ySeries labels");
    });
  });
});
