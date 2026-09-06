import { describe, expect, it } from "vitest";

import { select } from "d3";

import { renderReferenceLines } from "@/components/referenceLines.mjs";
import type { ReferenceLine } from "@/components/referenceLines.mjs";
import { scaleLinear } from "d3";

describe("renderReferenceLines", () => {
  const createMockBounds = () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    container.appendChild(svg);
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "bounds");
    svg.appendChild(g);
    return select(g as SVGGElement);
  };

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders one g.reference-line per entry", () => {
    const selection = createMockBounds();
    const xScale = scaleLinear().domain([0, 100]).range([0, 800]);
    const yScale = scaleLinear().domain([0, 100]).range([200, 0]);
    const lines: ReferenceLine[] = [
      { axis: "y", value: 25 },
      { axis: "y", value: 50 },
      { axis: "y", value: 75 },
    ];
    renderReferenceLines(selection, {
      innerHeight: 200,
      innerWidth: 800,
      lines,
      xScale,
      yScale,
    });
    const groups = selection.selectAll<SVGGElement, ReferenceLine>("g.reference-line");
    expect(groups.size()).toBe(3);
  });

  it("renders horizontal line with correct geometry", () => {
    const selection = createMockBounds();
    const xScale = scaleLinear().domain([0, 100]).range([0, 800]);
    const yScale = scaleLinear().domain([0, 100]).range([200, 0]);
    const lines: ReferenceLine[] = [{ axis: "y", value: 50 }];
    renderReferenceLines(selection, {
      innerHeight: 200,
      innerWidth: 800,
      lines,
      xScale,
      yScale,
    });
    const line = selection.select<SVGLineElement>("line.reference-line-stroke");
    expect(line.attr("x1")).toBe("0");
    expect(line.attr("x2")).toBe("800");
    // yScale(50) with domain [0,100] range [200,0] = 100
    expect(line.attr("y1")).toBe("100");
    expect(line.attr("y2")).toBe("100");
  });

  it("renders vertical line with correct geometry", () => {
    const selection = createMockBounds();
    const xScale = scaleLinear().domain([0, 100]).range([0, 800]);
    const yScale = scaleLinear().domain([0, 100]).range([200, 0]);
    const lines: ReferenceLine[] = [{ axis: "x", value: 50 }];
    renderReferenceLines(selection, {
      innerHeight: 200,
      innerWidth: 800,
      lines,
      xScale,
      yScale,
    });
    const line = selection.select<SVGLineElement>("line.reference-line-stroke");
    // xScale(50) with domain [0,100] range [0,800] = 400
    expect(line.attr("x1")).toBe("400");
    expect(line.attr("x2")).toBe("400");
    expect(line.attr("y1")).toBe("0");
    expect(line.attr("y2")).toBe("200");
  });

  it("renders label when provided", () => {
    const selection = createMockBounds();
    const xScale = scaleLinear().domain([0, 100]).range([0, 800]);
    const yScale = scaleLinear().domain([0, 100]).range([200, 0]);
    const lines: ReferenceLine[] = [{ axis: "y", value: 50, label: "Target" }];
    renderReferenceLines(selection, {
      innerHeight: 200,
      innerWidth: 800,
      lines,
      xScale,
      yScale,
    });
    const text = selection.select<SVGTextElement>("text.reference-line-label");
    expect(text.size()).toBeGreaterThan(0);
    expect(text.text()).toBe("Target");
    expect(text.attr("text-anchor")).toBe("end");
  });

  it("does not render text element when label is omitted", () => {
    const selection = createMockBounds();
    const xScale = scaleLinear().domain([0, 100]).range([0, 800]);
    const yScale = scaleLinear().domain([0, 100]).range([200, 0]);
    const lines: ReferenceLine[] = [{ axis: "y", value: 50 }];
    renderReferenceLines(selection, {
      innerHeight: 200,
      innerWidth: 800,
      lines,
      xScale,
      yScale,
    });
    const text = selection.select<SVGTextElement>("text.reference-line-label");
    expect(text.size()).toBe(0);
  });

  it("is idempotent on re-render", () => {
    const selection = createMockBounds();
    const xScale = scaleLinear().domain([0, 100]).range([0, 800]);
    const yScale = scaleLinear().domain([0, 100]).range([200, 0]);
    const lines: ReferenceLine[] = [{ axis: "y", value: 50 }];
    renderReferenceLines(selection, {
      innerHeight: 200,
      innerWidth: 800,
      lines,
      xScale,
      yScale,
    });
    const groupCount = selection.selectAll("g.reference-line").size();
    renderReferenceLines(selection, {
      innerHeight: 200,
      innerWidth: 800,
      lines,
      xScale,
      yScale,
    });
    expect(selection.selectAll("g.reference-line").size()).toBe(groupCount);
  });

  it("uses CSS variable styling on stroke line", () => {
    const selection = createMockBounds();
    const xScale = scaleLinear().domain([0, 100]).range([0, 800]);
    const yScale = scaleLinear().domain([0, 100]).range([200, 0]);
    const lines: ReferenceLine[] = [{ axis: "y", value: 50 }];
    renderReferenceLines(selection, {
      innerHeight: 200,
      innerWidth: 800,
      lines,
      xScale,
      yScale,
    });
    const line = selection.select<SVGLineElement>("line.reference-line-stroke");
    expect(line.attr("stroke")).toBe("var(--vl-reference-line-stroke, #94a3b8)");
    expect(line.attr("stroke-dasharray")).toBe("var(--vl-reference-line-dash-array, 6 6)");
    expect(line.attr("shape-rendering")).toBe("crispEdges");
  });

  it("skips entries with non-finite scaled position", () => {
    const selection = createMockBounds();
    // NaN scale - a mock that returns NaN for the value
    const badScale = {
      domain: () => [0, 100],
      range: () => [200, 0],
      call: () => badScale,
    } as unknown as ReturnType<typeof scaleLinear>;
    const xScale = scaleLinear().domain([0, 100]).range([0, 800]);
    const yScale = scaleLinear().domain([0, 100]).range([200, 0]);
    const lines: ReferenceLine[] = [
      { axis: "y", value: 50 },
      { axis: "y", value: 9999 }, // outside domain, would return NaN in clamp-less scale
    ];
    renderReferenceLines(selection, {
      innerHeight: 200,
      innerWidth: 800,
      lines,
      xScale,
      yScale,
    });
    // Only the valid line should render
    const groups = selection.selectAll<SVGGElement, ReferenceLine>("g.reference-line");
    expect(groups.size()).toBe(2); // Both groups exist, but one has hidden line
    const visibleLine = selection.select<SVGLineElement>("line.reference-line-stroke:not([visibility='hidden'])");
    expect(visibleLine.size()).toBe(1);
  });
});
