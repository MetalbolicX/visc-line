import { describe, expect, it } from "vitest";

import { select } from "d3";

import { renderYAxis } from "@/components/yAxis.mjs";
import { scaleLinear } from "d3";

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
});