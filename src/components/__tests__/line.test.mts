import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { select } from "d3";

import { renderLine } from "@/components/line.mjs";
import type { ProcessedSeries } from "@/types/index.mjs";
import { scaleLinear } from "d3";

interface TestPoint {
  readonly x: number;
  readonly y: number;
}

describe("renderLine", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: query.includes("reduce"),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
      }),
    });
    Object.defineProperty(SVGElement.prototype, "getTotalLength", {
      configurable: true,
      value: () => 100,
      writable: true,
    });
  });

  const createMockBounds = () => {
    const container = document.createElement("div");
    container.setAttribute("class", "bounds");
    document.body.appendChild(container);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    container.appendChild(svg);
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "bounds");
    svg.appendChild(g);
    const selection = select(g as SVGGElement);
    return { container, svg, g, selection };
  };

  const series: ProcessedSeries<TestPoint>[] = [
    {
      label: "series-a",
      accessor: (d) => d.y,
      data: [
        { x: 0, y: 10 },
        { x: 1, y: 20 },
        { x: 2, y: 15 },
      ],
    },
    {
      label: "series-b",
      accessor: (d) => d.y * 2,
      data: [
        { x: 0, y: 5 },
        { x: 1, y: 10 },
        { x: 2, y: 7 },
      ],
    },
  ];

  const xScale = scaleLinear().domain([0, 2]).range([0, 300]);
  const yScale = scaleLinear().domain([0, 40]).range([200, 0]);

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders one path per series", () => {
    const { selection } = createMockBounds();
    renderLine(selection, series, xScale, yScale, (d) => d.x);
    const paths = selection.selectAll<SVGPathElement, ProcessedSeries<TestPoint>>("path.chart-line");
    expect(paths.size()).toBe(2);
  });

  it("uses series label for class name", () => {
    const { selection } = createMockBounds();
    renderLine(selection, series, xScale, yScale, (d) => d.x);
    const firstPath = selection.select<SVGPathElement>("path.chart-line--series-a");
    expect(firstPath.empty()).toBe(false);
  });

  it("path elements have fill none", () => {
    const { selection } = createMockBounds();
    renderLine(selection, series, xScale, yScale, (d) => d.x);
    const path = selection.select<SVGPathElement>("path.chart-line");
    expect(path.attr("fill")).toBe("none");
  });

  it("is idempotent on re-render", () => {
    const { selection } = createMockBounds();
    renderLine(selection, series, xScale, yScale, (d) => d.x);
    const firstCount = selection.selectAll("path.chart-line").size();
    renderLine(selection, series, xScale, yScale, (d) => d.x);
    const secondCount = selection.selectAll("path.chart-line").size();
    expect(secondCount).toBe(firstCount);
  });

  it("accepts curve preset string", () => {
    const { selection } = createMockBounds();
    renderLine(selection, series, xScale, yScale, (d) => d.x, { curve: "monotoneX" });
    const path = selection.select<SVGPathElement>("path.chart-line");
    expect(path.empty()).toBe(false);
  });

  it("renders empty path array when series is empty", () => {
    const { selection } = createMockBounds();
    renderLine(selection, [], xScale, yScale, (d) => d.x);
    expect(selection.selectAll("path.chart-line").size()).toBe(0);
  });

  it("skips stroke-dashoffset animation when reducedMotion is true", () => {
    const { selection } = createMockBounds();
    renderLine(selection, series, xScale, yScale, (d) => d.x, {
      reducedMotion: true,
      transitionDuration: 0,
    });
    const path = selection.select<SVGPathElement>("path.chart-line");
    expect(path.attr("stroke-dasharray")).toBeNull();
  });

  it("uses custom stroke when provided in series", () => {
    const { selection } = createMockBounds();
    const customSeries: ProcessedSeries<TestPoint>[] = [
      {
        label: "custom",
        accessor: (d) => d.y,
        stroke: "#ff0000",
        data: [{ x: 0, y: 10 }],
      },
    ];
    renderLine(selection, customSeries, xScale, yScale, (d) => d.x);
    const path = selection.select<SVGPathElement>("path.chart-line--custom");
    expect(path.attr("stroke")).toBe("#ff0000");
  });
});