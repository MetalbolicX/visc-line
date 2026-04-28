import { describe, expect, it } from "vitest";

import { select } from "d3";

import { renderYAxis } from "@/components/yAxis.mjs";
import { scaleLinear, scaleTime } from "d3";

describe("renderYAxis", () => {
  const createMockBounds = () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    container.appendChild(svg);
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "bounds");
    svg.appendChild(g);
    const selection = select(g as SVGGElement);
    return { container, svg, g, selection };
  };

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("creates one y-axis group", () => {
    const { selection } = createMockBounds();
    const yScale = scaleLinear().domain([0, 100]).range([200, 0]);
    renderYAxis(selection, yScale);
    const axisGroup = selection.select<SVGGElement>("g.y-axis");
    expect(axisGroup.empty()).toBe(false);
  });

  it("is idempotent on re-render", () => {
    const { selection } = createMockBounds();
    const yScale = scaleLinear().domain([0, 100]).range([200, 0]);
    renderYAxis(selection, yScale);
    renderYAxis(selection, yScale);
    expect(selection.selectAll("g.y-axis").size()).toBe(1);
  });

  it("accepts custom tickCount", () => {
    const { selection } = createMockBounds();
    const yScale = scaleLinear().domain([0, 100]).range([200, 0]);
    renderYAxis(selection, yScale, { tickCount: 10 });
    expect(selection.select("g.y-axis").empty()).toBe(false);
  });

  it("renders tick labels", () => {
    const { selection } = createMockBounds();
    const yScale = scaleLinear().domain([0, 100]).range([200, 0]);
    renderYAxis(selection, yScale);
    const ticks = selection.selectAll("g.y-axis g.tick");
    expect(ticks.size()).toBeGreaterThan(0);
  });

  it("positions the axis at the left (transform not set — native axisLeft)", () => {
    const { selection } = createMockBounds();
    const yScale = scaleLinear().domain([0, 100]).range([200, 0]);
    renderYAxis(selection, yScale);
    const axisGroup = selection.select<SVGGElement>("g.y-axis");
    // axisLeft renders at x=0 by default, no translate needed
    expect(axisGroup.attr("transform")).toBeNull();
  });

  it("works with time scale", () => {
    const { selection } = createMockBounds();
    const yScale = scaleTime()
      .domain([new Date("2023-01-01"), new Date("2023-01-31")])
      .range([200, 0]);
    renderYAxis(selection, yScale);
    const ticks = selection.selectAll("g.y-axis g.tick");
    expect(ticks.size()).toBeGreaterThan(0);
  });

  it("applies custom tickFormat", () => {
    const { selection } = createMockBounds();
    const yScale = scaleLinear().domain([0, 100]).range([200, 0]);
    renderYAxis(selection, yScale, {
      tickFormat: (v) => `${String(v)}%`,
    });
    const tickTexts = selection.selectAll("g.y-axis g.tick text");
    // At least one tick should contain "%"
    const allText = tickTexts.nodes().map((n) => n.textContent ?? "").join(" ");
    expect(allText).toContain("%");
  });

  it("applies CSS variable styling to tick labels", () => {
    const { selection } = createMockBounds();
    const yScale = scaleLinear().domain([0, 100]).range([200, 0]);
    renderYAxis(selection, yScale);
    const label = selection.select<SVGTextElement>("g.y-axis g.tick text");
    expect(label.style("fill")).toBe("var(--vl-axis-color, #333333)");
    expect(label.style("font-size")).toBe("var(--vl-axis-font-size, 12px)");
  });
});
