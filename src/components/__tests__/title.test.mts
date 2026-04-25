import { afterEach, describe, expect, it } from "vitest";

import { select } from "d3";

import { renderTitle } from "@/components/title.mjs";

describe("renderTitle", () => {
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

  it("creates exactly one text.chart-title element", () => {
    const svg = createMockSVG();
    renderTitle(svg, { margins: { top: 0, right: 0, bottom: 0, left: 0 }, title: "My Chart", width: 800 });
    expect(svg.selectAll<SVGTextElement, null>("text.chart-title").size()).toBe(1);
  });

  it("sets text content to the title string", () => {
    const svg = createMockSVG();
    renderTitle(svg, { margins: { top: 0, right: 0, bottom: 0, left: 0 }, title: "Revenue 2024", width: 800 });
    expect(svg.select<SVGTextElement>("text.chart-title").text()).toBe("Revenue 2024");
  });

  it("centers text horizontally using margins and width", () => {
    const svg = createMockSVG();
    const opts = { margins: { top: 0, right: 20, bottom: 0, left: 60 }, title: "Centered", width: 800 };
    renderTitle(svg, opts);
    const text = svg.select<SVGTextElement>("text.chart-title");
    expect(text.attr("x")).toBe(String(60 + (800 - 60 - 20) / 2));
  });

  it("positions text vertically at margins.top / 2", () => {
    const svg = createMockSVG();
    const opts = { margins: { top: 40, right: 0, bottom: 0, left: 0 }, title: "Vertical", width: 800 };
    renderTitle(svg, opts);
    const text = svg.select<SVGTextElement>("text.chart-title");
    expect(text.attr("y")).toBe("20");
  });

  it("sets text-anchor middle", () => {
    const svg = createMockSVG();
    renderTitle(svg, { margins: { top: 0, right: 0, bottom: 0, left: 0 }, title: "Test", width: 800 });
    expect(svg.select<SVGTextElement>("text.chart-title").attr("text-anchor")).toBe("middle");
  });

  it("applies font-size from CSS variable", () => {
    const svg = createMockSVG();
    renderTitle(svg, { margins: { top: 0, right: 0, bottom: 0, left: 0 }, title: "Test", width: 800 });
    expect(svg.select<SVGTextElement>("text.chart-title").style("font-size")).toBe("var(--vl-title-font-size, 16px)");
  });

  it("applies font-weight from CSS variable", () => {
    const svg = createMockSVG();
    renderTitle(svg, { margins: { top: 0, right: 0, bottom: 0, left: 0 }, title: "Test", width: 800 });
    expect(svg.select<SVGTextElement>("text.chart-title").style("font-weight")).toBe("var(--vl-title-font-weight, 600)");
  });

  it("applies fill color from CSS variable", () => {
    const svg = createMockSVG();
    renderTitle(svg, { margins: { top: 0, right: 0, bottom: 0, left: 0 }, title: "Test", width: 800 });
    expect(svg.select<SVGTextElement>("text.chart-title").style("fill")).toBe("var(--vl-title-color, #222222)");
  });

  it("is idempotent on re-render", () => {
    const svg = createMockSVG();
    const opts = { margins: { top: 20, right: 0, bottom: 0, left: 50 }, title: "Idempotent", width: 800 };
    renderTitle(svg, opts);
    renderTitle(svg, opts);
    expect(svg.selectAll("text.chart-title").size()).toBe(1);
  });

  it("renders empty string when title is empty", () => {
    const svg = createMockSVG();
    renderTitle(svg, { margins: { top: 0, right: 0, bottom: 0, left: 0 }, title: "", width: 800 });
    expect(svg.select<SVGTextElement>("text.chart-title").text()).toBe("");
  });
});