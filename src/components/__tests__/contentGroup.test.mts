import { afterEach, describe, expect, it } from "vitest";

import { select } from "d3";

import { createMockSVG } from "@/__tests__/helpers/createMockSVG.mjs";
import { renderBoundsGroup } from "@/components/boundsGroup.mjs";
import { renderContentGroup } from "@/components/contentGroup.mjs";

describe("renderContentGroup", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  const clipPathId = "test-clip";

  it("creates a g.content element inside bounds group", () => {
    const svg = createMockSVG();
    const bounds = renderBoundsGroup(svg, { top: 0, right: 0, bottom: 0, left: 0 });
    renderContentGroup(bounds, svg, { clipPathId, innerWidth: 800, innerHeight: 400 });
    expect(bounds.selectAll<SVGGElement, null>("g.content").size()).toBe(1);
  });

  it("upserts defs element on root SVG", () => {
    const svg = createMockSVG();
    const bounds = renderBoundsGroup(svg, { top: 0, right: 0, bottom: 0, left: 0 });
    renderContentGroup(bounds, svg, { clipPathId, innerWidth: 800, innerHeight: 400 });
    expect(svg.selectAll<SVGDefsElement, null>("defs").size()).toBe(1);
  });

  it("creates clipPath with the provided id", () => {
    const svg = createMockSVG();
    const bounds = renderBoundsGroup(svg, { top: 0, right: 0, bottom: 0, left: 0 });
    renderContentGroup(bounds, svg, { clipPathId, innerWidth: 800, innerHeight: 400 });
    const clipPath = svg.select(`clipPath#${clipPathId}`);
    expect(clipPath.empty()).toBe(false);
  });

  it("sizes clip rect to innerWidth and innerHeight", () => {
    const svg = createMockSVG();
    const bounds = renderBoundsGroup(svg, { top: 0, right: 0, bottom: 0, left: 0 });
    renderContentGroup(bounds, svg, { clipPathId, innerWidth: 800, innerHeight: 400 });
    const rect = svg.select(`clipPath#${clipPathId}`).select<SVGRectElement>("rect");
    expect(rect.attr("width")).toBe("800");
    expect(rect.attr("height")).toBe("400");
  });

  it("applies clip-path url to content group", () => {
    const svg = createMockSVG();
    const bounds = renderBoundsGroup(svg, { top: 0, right: 0, bottom: 0, left: 0 });
    renderContentGroup(bounds, svg, { clipPathId, innerWidth: 800, innerHeight: 400 });
    const content = bounds.select<SVGGElement>("g.content");
    expect(content.attr("clip-path")).toBe(`url(#${clipPathId})`);
  });

  it("is idempotent on re-render", () => {
    const svg = createMockSVG();
    const bounds = renderBoundsGroup(svg, { top: 0, right: 0, bottom: 0, left: 0 });
    renderContentGroup(bounds, svg, { clipPathId, innerWidth: 800, innerHeight: 400 });
    renderContentGroup(bounds, svg, { clipPathId, innerWidth: 800, innerHeight: 400 });
    expect(bounds.selectAll("g.content").size()).toBe(1);
    expect(svg.selectAll("defs").size()).toBe(1);
    expect(svg.select(`clipPath#${clipPathId}`).empty()).toBe(false);
  });
});