import { afterEach, describe, expect, it } from "vitest";

import { select } from "d3";

import { renderBoundsGroup } from "@/components/boundsGroup.mjs";
import { renderContentGroup } from "@/components/contentGroup.mjs";

describe("renderContentGroup", () => {
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

  it("creates a g.content element inside bounds group", () => {
    const svg = createMockSVG();
    const bounds = renderBoundsGroup(svg, { top: 0, right: 0, bottom: 0, left: 0 });
    renderContentGroup(bounds, svg, { innerWidth: 800, innerHeight: 400 });
    expect(bounds.selectAll<SVGGElement, null>("g.content").size()).toBe(1);
  });

  it("upserts defs element on root SVG", () => {
    const svg = createMockSVG();
    const bounds = renderBoundsGroup(svg, { top: 0, right: 0, bottom: 0, left: 0 });
    renderContentGroup(bounds, svg, { innerWidth: 800, innerHeight: 400 });
    expect(svg.selectAll<SVGDefsElement, null>("defs").size()).toBe(1);
  });

  it("creates clipPath with id chart-content-clip", () => {
    const svg = createMockSVG();
    const bounds = renderBoundsGroup(svg, { top: 0, right: 0, bottom: 0, left: 0 });
    renderContentGroup(bounds, svg, { innerWidth: 800, innerHeight: 400 });
    const clipPath = svg.select("clipPath#chart-content-clip");
    expect(clipPath.empty()).toBe(false);
  });

  it("sizes clip rect to innerWidth and innerHeight", () => {
    const svg = createMockSVG();
    const bounds = renderBoundsGroup(svg, { top: 0, right: 0, bottom: 0, left: 0 });
    renderContentGroup(bounds, svg, { innerWidth: 800, innerHeight: 400 });
    const rect = svg.select("clipPath#chart-content-clip").select<SVGRectElement>("rect");
    expect(rect.attr("width")).toBe("800");
    expect(rect.attr("height")).toBe("400");
  });

  it("applies clip-path url to content group", () => {
    const svg = createMockSVG();
    const bounds = renderBoundsGroup(svg, { top: 0, right: 0, bottom: 0, left: 0 });
    renderContentGroup(bounds, svg, { innerWidth: 800, innerHeight: 400 });
    const content = bounds.select<SVGGElement>("g.content");
    expect(content.attr("clip-path")).toBe("url(#chart-content-clip)");
  });

  it("is idempotent on re-render", () => {
    const svg = createMockSVG();
    const bounds = renderBoundsGroup(svg, { top: 0, right: 0, bottom: 0, left: 0 });
    renderContentGroup(bounds, svg, { innerWidth: 800, innerHeight: 400 });
    renderContentGroup(bounds, svg, { innerWidth: 800, innerHeight: 400 });
    expect(bounds.selectAll("g.content").size()).toBe(1);
    expect(svg.selectAll("defs").size()).toBe(1);
    expect(svg.select("clipPath#chart-content-clip").empty()).toBe(false);
  });
});