import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { select } from "d3";

import { renderLine } from "@/components/line.mjs";
import type { ProcessedSeries } from "@/types/index.mjs";
import { scaleLinear } from "d3";

interface TestPoint {
  readonly x: number;
  readonly y: number;
}

describe("renderLine — gap bridging characterization (plan-025)", () => {
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

  const xScale = scaleLinear().domain([0, 3]).range([0, 300]);
  const yScale = scaleLinear().domain([0, 4]).range([200, 0]);

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("plan-025: current behavior — NaN-y row is dropped and line bridges the gap (single M command)", () => {
    // This test documents the OLD default behavior: processNumericData drops the
    // NaN-y row, so d3.line() receives a contiguous array and draws one segment.
    const { selection } = createMockBounds();
    const series: ProcessedSeries<TestPoint>[] = [
      {
        label: "gapped",
        accessor: (d: TestPoint) => d.y,
        // Note: this data is ALREADY FILTERED by processNumericData — NaN row removed.
        // So the path will be continuous (1 M) showing the old bridging behavior.
        data: [
          { x: 0, y: 1 },
          { x: 1, y: 2 },
          { x: 3, y: 3 },
        ],
      },
    ];
    renderLine(selection, series, xScale, yScale, (d: TestPoint) => d.x, { reducedMotion: true });
    const path = selection.select<SVGPathElement>("path.chart-line--gapped");
    const d = path.attr("d") ?? "";
    // One continuous segment = one M command
    const moveToCount = (d.match(/M/g) ?? []).length;
    expect(moveToCount).toBe(1);
  });

  it("plan-025: with defined option — NaN-y row causes a break (two M commands)", () => {
    const { selection } = createMockBounds();
    const series: ProcessedSeries<TestPoint>[] = [
      {
        label: "gapped",
        accessor: (d: TestPoint) => d.y,
        // Data contains a NaN-y row in the middle — with .defined() the line should break.
        data: [
          { x: 0, y: 1 },
          { x: 1, y: 2 },
          { x: 2, y: NaN },
          { x: 3, y: 3 },
        ],
      },
    ];
    renderLine(selection, series, xScale, yScale, (d: TestPoint) => d.x, {
      defined: (d: TestPoint) => Number.isFinite(d.y),
      reducedMotion: true,
    });
    const path = selection.select<SVGPathElement>("path.chart-line--gapped");
    const d = path.attr("d") ?? "";
    // Break at NaN-y = two separate segments = two M commands
    const moveToCount = (d.match(/M/g) ?? []).length;
    expect(moveToCount).toBe(2);
  });

  it("plan-025: defined option — gap at start produces no phantom segment", () => {
    const { selection } = createMockBounds();
    const series: ProcessedSeries<TestPoint>[] = [
      {
        label: "gapped",
        accessor: (d: TestPoint) => d.y,
        data: [
          { x: 0, y: NaN },
          { x: 1, y: 2 },
          { x: 2, y: 3 },
        ],
      },
    ];
    renderLine(selection, series, xScale, yScale, (d: TestPoint) => d.x, {
      defined: (d: TestPoint) => Number.isFinite(d.y),
      reducedMotion: true,
    });
    const path = selection.select<SVGPathElement>("path.chart-line--gapped");
    const d = path.attr("d") ?? "";
    // Gap at start — only one valid segment, one M
    const moveToCount = (d.match(/M/g) ?? []).length;
    expect(moveToCount).toBe(1);
  });

  it("plan-025: defined option — all-y-invalid series produces empty/null path (no crash)", () => {
    const { selection } = createMockBounds();
    const series: ProcessedSeries<TestPoint>[] = [
      {
        label: "all-invalid",
        accessor: (d: TestPoint) => d.y,
        data: [
          { x: 0, y: NaN },
          { x: 1, y: NaN },
          { x: 2, y: NaN },
        ],
      },
    ];
    // Should not throw
    renderLine(selection, series, xScale, yScale, (d: TestPoint) => d.x, {
      defined: (d: TestPoint) => Number.isFinite(d.y),
      reducedMotion: true,
    });
    const path = selection.select<SVGPathElement>("path.chart-line--all-invalid");
    const d = path.attr("d");
    // Path should be null or empty string (no segment to draw)
    expect(d == null || d === "").toBe(true);
  });
});

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
      accessor: (d: TestPoint) => d.y,
      data: [
        { x: 0, y: 10 },
        { x: 1, y: 20 },
        { x: 2, y: 15 },
      ],
    },
    {
      label: "series-b",
      accessor: (d: TestPoint) => d.y * 2,
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
    renderLine(selection, series, xScale, yScale, (d: TestPoint) => d.x);
    const paths = selection.selectAll<SVGPathElement, ProcessedSeries<TestPoint>>("path.chart-line");
    expect(paths.size()).toBe(2);
  });

  it("uses series label for class name", () => {
    const { selection } = createMockBounds();
    renderLine(selection, series, xScale, yScale, (d: TestPoint) => d.x);
    const firstPath = selection.select<SVGPathElement>("path.chart-line--series-a");
    expect(firstPath.empty()).toBe(false);
  });

  it("path elements have fill none", () => {
    const { selection } = createMockBounds();
    renderLine(selection, series, xScale, yScale, (d: TestPoint) => d.x);
    const path = selection.select<SVGPathElement>("path.chart-line");
    expect(path.attr("fill")).toBe("none");
  });

  it("is idempotent on re-render", () => {
    const { selection } = createMockBounds();
    renderLine(selection, series, xScale, yScale, (d: TestPoint) => d.x);
    const firstCount = selection.selectAll("path.chart-line").size();
    renderLine(selection, series, xScale, yScale, (d: TestPoint) => d.x);
    const secondCount = selection.selectAll("path.chart-line").size();
    expect(secondCount).toBe(firstCount);
  });

  it("accepts curve preset string", () => {
    const { selection } = createMockBounds();
    renderLine(selection, series, xScale, yScale, (d: TestPoint) => d.x, { curve: "monotoneX" });
    const path = selection.select<SVGPathElement>("path.chart-line");
    expect(path.empty()).toBe(false);
  });

  it("renders empty path array when series is empty", () => {
    const { selection } = createMockBounds();
    renderLine(selection, [], xScale, yScale, (d: TestPoint) => d.x);
    expect(selection.selectAll("path.chart-line").size()).toBe(0);
  });

  it("skips stroke-dashoffset animation when reducedMotion is true", () => {
    const { selection } = createMockBounds();
    renderLine(selection, series, xScale, yScale, (d: TestPoint) => d.x, {
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
        accessor: (d: TestPoint) => d.y,
        stroke: "#ff0000",
        data: [{ x: 0, y: 10 }],
      },
    ];
    renderLine(selection, customSeries, xScale, yScale, (d: TestPoint) => d.x);
    const path = selection.select<SVGPathElement>("path.chart-line--custom");
    expect(path.attr("stroke")).toBe("#ff0000");
  });
});
