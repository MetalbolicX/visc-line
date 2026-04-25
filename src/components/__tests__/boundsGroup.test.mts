import { afterEach, describe, expect, it } from "vitest";

import { select } from "d3";

import { renderBoundsGroup } from "@/components/boundsGroup.mjs";

describe("renderBoundsGroup", () => {
  const createMockSVG = () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    container.appendChild(svg);
    return select(svg as SVGSVGElement);
  };

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("creates exactly one g.bounds element", () => {
    const svg = createMockSVG();
    renderBoundsGroup(svg, { top: 0, right: 0, bottom: 0, left: 0 });
    expect(svg.selectAll<SVGGElement, null>("g.bounds").size()).toBe(1);
  });

  it("applies translate transform with margins", () => {
    const svg = createMockSVG();
    renderBoundsGroup(svg, { top: 0, right: 20, bottom: 40, left: 60 });
    const g = svg.select<SVGGElement>("g.bounds");
    expect(g.attr("transform")).toBe("translate(60,0)");
  });

  it("uses all four margin values", () => {
    const svg = createMockSVG();
    renderBoundsGroup(svg, { top: 10, right: 20, bottom: 30, left: 40 });
    const g = svg.select<SVGGElement>("g.bounds");
    expect(g.attr("transform")).toBe("translate(40,10)");
  });

  it("is idempotent on re-render", () => {
    const svg = createMockSVG();
    const margins = { top: 20, right: 0, bottom: 0, left: 50 };
    renderBoundsGroup(svg, margins);
    renderBoundsGroup(svg, margins);
    expect(svg.selectAll("g.bounds").size()).toBe(1);
  });
});