import { describe, expect, it } from "vitest";

import { select } from "d3";

import { renderXAxis } from "@/components/xAxis.mjs";
import { scaleLinear, scaleTime } from "d3";

describe("renderXAxis", () => {
  const createMockBounds = (innerHeight = 200) => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    container.appendChild(svg);
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "bounds");
    svg.appendChild(g);
    const selection = select(g as SVGGElement);
    Object.defineProperty(container, "clientWidth", { value: 800 });
    Object.defineProperty(container, "clientHeight", { value: innerHeight + 50 });
    return { container, svg, g, selection };
  };

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("creates one x-axis group", () => {
    const { selection } = createMockBounds();
    const xScale = scaleLinear().domain([0, 100]).range([0, 800]);
    renderXAxis(selection, xScale, 200);
    const axisGroup = selection.select<SVGGElement>("g.x-axis");
    expect(axisGroup.empty()).toBe(false);
  });

  it("positions axis at innerHeight", () => {
    const { selection } = createMockBounds();
    const xScale = scaleLinear().domain([0, 100]).range([0, 800]);
    renderXAxis(selection, xScale, 200);
    const axisGroup = selection.select<SVGGElement>("g.x-axis");
    expect(axisGroup.attr("transform")).toBe("translate(0,200)");
  });

  it("is idempotent on re-render", () => {
    const { selection } = createMockBounds();
    const xScale = scaleLinear().domain([0, 100]).range([0, 800]);
    renderXAxis(selection, xScale, 200);
    renderXAxis(selection, xScale, 200);
    expect(selection.selectAll("g.x-axis").size()).toBe(1);
  });

  it("accepts custom tickCount", () => {
    const { selection } = createMockBounds();
    const xScale = scaleLinear().domain([0, 100]).range([0, 800]);
    renderXAxis(selection, xScale, 200, { tickCount: 10 });
    expect(selection.select("g.x-axis").empty()).toBe(false);
  });

  it("renders with time scale", () => {
    const { selection } = createMockBounds();
    const xScale = scaleTime()
      .domain([new Date("2023-01-01"), new Date("2023-12-31")])
      .range([0, 800]);
    renderXAxis(selection, xScale, 200);
    expect(selection.select("g.x-axis").empty()).toBe(false);
  });
});