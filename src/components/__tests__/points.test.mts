import { describe, expect, it } from "vitest";

import { select } from "d3";

import { renderPoints } from "@/components/points.mjs";
import type { ProcessedSeries } from "@/types/index.mjs";
import { scaleLinear } from "d3";

interface TestPoint {
  readonly x: number;
  readonly y: number;
}

describe("renderPoints", () => {
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

  const series: ProcessedSeries<TestPoint>[] = [
    {
      label: "points-a",
      accessor: (d) => d.y,
      data: [
        { x: 0, y: 10 },
        { x: 1, y: 20 },
        { x: 2, y: 15 },
      ],
    },
  ];

  const xScale = scaleLinear().domain([0, 2]).range([0, 300]);
  const yScale = scaleLinear().domain([0, 40]).range([200, 0]);

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders one group per series", () => {
    const { selection } = createMockBounds();
    renderPoints(selection, series, xScale, yScale, (d) => d.x);
    const groups = selection.selectAll<SVGGElement, ProcessedSeries<TestPoint>>("g.point-series");
    expect(groups.size()).toBe(1);
  });

  it("renders circles inside the group", () => {
    const { selection } = createMockBounds();
    renderPoints(selection, series, xScale, yScale, (d) => d.x);
    const circles = selection.selectAll<SVGCircleElement, TestPoint>("circle.point");
    expect(circles.size()).toBe(3);
  });

  it("is idempotent on re-render", () => {
    const { selection } = createMockBounds();
    renderPoints(selection, series, xScale, yScale, (d) => d.x);
    renderPoints(selection, series, xScale, yScale, (d) => d.x);
    const circles = selection.selectAll<SVGCircleElement, TestPoint>("circle.point");
    expect(circles.size()).toBe(3);
  });

  it("renders zero circles when series is empty", () => {
    const { selection } = createMockBounds();
    renderPoints(selection, [], xScale, yScale, (d) => d.x);
    expect(selection.selectAll("circle.point").size()).toBe(0);
  });

  it("uses series label in class name", () => {
    const { selection } = createMockBounds();
    renderPoints(selection, series, xScale, yScale, (d) => d.x);
    const group = selection.select<SVGGElement>("g.point-series--points-a");
    expect(group.empty()).toBe(false);
  });
});