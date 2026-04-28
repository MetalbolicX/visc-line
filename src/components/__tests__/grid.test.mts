import { describe, expect, it } from "vitest";

import { select } from "d3";

import { renderXGrid, renderYGrid } from "@/components/grid.mjs";
import { scaleLinear } from "d3";

describe("renderXGrid", () => {
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

  it("renders horizontal grid lines", () => {
    const selection = createMockBounds();
    const xScale = scaleLinear().domain([0, 100]).range([0, 800]);
    const yScale = scaleLinear().domain([0, 50]).range([200, 0]);
    renderXGrid(selection, xScale, yScale);
    const lines = selection.selectAll<SVGLineElement, unknown>("line.grid-x");
    expect(lines.size()).toBeGreaterThan(0);
  });

  it("is idempotent on re-render", () => {
    const selection = createMockBounds();
    const xScale = scaleLinear().domain([0, 100]).range([0, 800]);
    const yScale = scaleLinear().domain([0, 50]).range([200, 0]);
    renderXGrid(selection, xScale, yScale);
    const lineCount = selection.selectAll("line.grid-x").size();
    renderXGrid(selection, xScale, yScale);
    expect(selection.selectAll("line.grid-x").size()).toBe(lineCount);
  });

  it("uses CSS variable styling", () => {
    const selection = createMockBounds();
    const xScale = scaleLinear().domain([0, 100]).range([0, 800]);
    const yScale = scaleLinear().domain([0, 50]).range([200, 0]);
    renderXGrid(selection, xScale, yScale);
    const line = selection.select<SVGLineElement>("line.grid-x");
    expect(line.attr("stroke")).toBe("var(--vl-grid-stroke, #e6e6e6)");
    expect(line.attr("shape-rendering")).toBe("crispEdges");
  });
});

describe("renderYGrid", () => {
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

  it("renders vertical grid lines", () => {
    const selection = createMockBounds();
    const xScale = scaleLinear().domain([0, 100]).range([0, 800]);
    const yScale = scaleLinear().domain([0, 50]).range([200, 0]);
    renderYGrid(selection, xScale, yScale);
    const lines = selection.selectAll<SVGLineElement, unknown>("line.grid-y");
    expect(lines.size()).toBeGreaterThan(0);
  });

  it("is idempotent on re-render", () => {
    const selection = createMockBounds();
    const xScale = scaleLinear().domain([0, 100]).range([0, 800]);
    const yScale = scaleLinear().domain([0, 50]).range([200, 0]);
    renderYGrid(selection, xScale, yScale);
    const lineCount = selection.selectAll("line.grid-y").size();
    renderYGrid(selection, xScale, yScale);
    expect(selection.selectAll("line.grid-y").size()).toBe(lineCount);
  });

  it("uses CSS variable styling", () => {
    const selection = createMockBounds();
    const xScale = scaleLinear().domain([0, 100]).range([0, 800]);
    const yScale = scaleLinear().domain([0, 50]).range([200, 0]);
    renderYGrid(selection, xScale, yScale);
    const line = selection.select<SVGLineElement>("line.grid-y");
    expect(line.attr("stroke")).toBe("var(--vl-grid-stroke, #e6e6e6)");
    expect(line.attr("shape-rendering")).toBe("crispEdges");
  });
});
