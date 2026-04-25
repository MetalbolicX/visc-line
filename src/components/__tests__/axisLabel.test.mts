import { afterEach, describe, expect, it } from "vitest";

import { select } from "d3";

import { createMockSVG } from "@/__tests__/helpers/createMockSVG.mjs";
import { renderXAxisLabel, renderYAxisLabel } from "@/components/axisLabel.mjs";

describe("renderXAxisLabel", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("creates exactly one text.x-axis-label element", () => {
    const svg = createMockSVG();
    renderXAxisLabel(svg, { innerHeight: 400, innerWidth: 800, margins: { top: 20, right: 20, bottom: 40, left: 60 }, label: "Time" });
    expect(svg.selectAll<SVGTextElement, null>("text.x-axis-label").size()).toBe(1);
  });

  it("sets text content to label", () => {
    const svg = createMockSVG();
    renderXAxisLabel(svg, { innerHeight: 400, innerWidth: 800, margins: { top: 20, right: 20, bottom: 40, left: 60 }, label: "Revenue ($)" });
    expect(svg.select<SVGTextElement>("text.x-axis-label").text()).toBe("Revenue ($)");
  });

  it("centers label horizontally below chart", () => {
    const svg = createMockSVG();
    const opts = { innerHeight: 400, innerWidth: 800, margins: { top: 20, right: 20, bottom: 40, left: 60 }, label: "X Label" };
    renderXAxisLabel(svg, opts);
    const text = svg.select<SVGTextElement>("text.x-axis-label");
    expect(text.attr("x")).toBe(String(60 + 800 / 2));
  });

  it("positions label below innerHeight + margins.top offset", () => {
    const svg = createMockSVG();
    const opts = { innerHeight: 400, innerWidth: 800, margins: { top: 20, right: 20, bottom: 40, left: 60 }, label: "Time (s)" };
    renderXAxisLabel(svg, opts);
    const text = svg.select<SVGTextElement>("text.x-axis-label");
    expect(text.attr("y")).toBe(String(20 + 400 + 40));
  });

  it("sets text-anchor middle", () => {
    const svg = createMockSVG();
    renderXAxisLabel(svg, { innerHeight: 400, innerWidth: 800, margins: { top: 20, right: 20, bottom: 40, left: 60 }, label: "Test" });
    expect(svg.select<SVGTextElement>("text.x-axis-label").attr("text-anchor")).toBe("middle");
  });

  it("applies font-size from CSS variable", () => {
    const svg = createMockSVG();
    renderXAxisLabel(svg, { innerHeight: 400, innerWidth: 800, margins: { top: 20, right: 20, bottom: 40, left: 60 }, label: "Test" });
    expect(svg.select<SVGTextElement>("text.x-axis-label").style("font-size")).toBe("var(--vl-axis-font-size, 12px)");
  });

  it("applies fill color from CSS variable", () => {
    const svg = createMockSVG();
    renderXAxisLabel(svg, { innerHeight: 400, innerWidth: 800, margins: { top: 20, right: 20, bottom: 40, left: 60 }, label: "Test" });
    expect(svg.select<SVGTextElement>("text.x-axis-label").style("fill")).toBe("var(--vl-axis-color, #333333)");
  });

  it("renders empty string when label is undefined", () => {
    const svg = createMockSVG();
    renderXAxisLabel(svg, { innerHeight: 400, innerWidth: 800, margins: { top: 20, right: 20, bottom: 40, left: 60 }, label: undefined });
    expect(svg.select<SVGTextElement>("text.x-axis-label").text()).toBe("");
  });

  it("is idempotent on re-render", () => {
    const svg = createMockSVG();
    const opts = { innerHeight: 400, innerWidth: 800, margins: { top: 20, right: 20, bottom: 40, left: 60 }, label: "Idempotent" };
    renderXAxisLabel(svg, opts);
    renderXAxisLabel(svg, opts);
    expect(svg.selectAll("text.x-axis-label").size()).toBe(1);
  });
});

describe("renderYAxisLabel", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("creates exactly one text.y-axis-label element", () => {
    const svg = createMockSVG();
    renderYAxisLabel(svg, { innerHeight: 400, margins: { top: 20, right: 20, bottom: 40, left: 60 }, label: "Values" });
    expect(svg.selectAll<SVGTextElement, null>("text.y-axis-label").size()).toBe(1);
  });

  it("sets text content to label", () => {
    const svg = createMockSVG();
    renderYAxisLabel(svg, { innerHeight: 400, margins: { top: 20, right: 20, bottom: 40, left: 60 }, label: "Temperature (°C)" });
    expect(svg.select<SVGTextElement>("text.y-axis-label").text()).toBe("Temperature (°C)");
  });

  it("applies rotate(-90) transform", () => {
    const svg = createMockSVG();
    renderYAxisLabel(svg, { innerHeight: 400, margins: { top: 20, right: 20, bottom: 40, left: 60 }, label: "Test" });
    const text = svg.select<SVGTextElement>("text.y-axis-label");
    expect(text.attr("transform")).toContain("rotate(-90)");
  });

  it("translates to left of chart at vertical center", () => {
    const svg = createMockSVG();
    const opts = { innerHeight: 400, margins: { top: 20, right: 20, bottom: 40, left: 60 }, label: "Test" };
    renderYAxisLabel(svg, opts);
    const text = svg.select<SVGTextElement>("text.y-axis-label");
    const transform = text.attr("transform") ?? "";
    expect(transform).toContain("translate(20,220)");
    expect(transform).toContain("rotate(-90)");
  });

  it("sets text-anchor middle", () => {
    const svg = createMockSVG();
    renderYAxisLabel(svg, { innerHeight: 400, margins: { top: 20, right: 20, bottom: 40, left: 60 }, label: "Test" });
    expect(svg.select<SVGTextElement>("text.y-axis-label").attr("text-anchor")).toBe("middle");
  });

  it("applies font-size from CSS variable", () => {
    const svg = createMockSVG();
    renderYAxisLabel(svg, { innerHeight: 400, margins: { top: 20, right: 20, bottom: 40, left: 60 }, label: "Test" });
    expect(svg.select<SVGTextElement>("text.y-axis-label").style("font-size")).toBe("var(--vl-axis-font-size, 12px)");
  });

  it("applies fill color from CSS variable", () => {
    const svg = createMockSVG();
    renderYAxisLabel(svg, { innerHeight: 400, margins: { top: 20, right: 20, bottom: 40, left: 60 }, label: "Test" });
    expect(svg.select<SVGTextElement>("text.y-axis-label").style("fill")).toBe("var(--vl-axis-color, #333333)");
  });

  it("renders empty string when label is undefined", () => {
    const svg = createMockSVG();
    renderYAxisLabel(svg, { innerHeight: 400, margins: { top: 20, right: 20, bottom: 40, left: 60 }, label: undefined });
    expect(svg.select<SVGTextElement>("text.y-axis-label").text()).toBe("");
  });

  it("is idempotent on re-render", () => {
    const svg = createMockSVG();
    const opts = { innerHeight: 400, margins: { top: 20, right: 20, bottom: 40, left: 60 }, label: "Idempotent" };
    renderYAxisLabel(svg, opts);
    renderYAxisLabel(svg, opts);
    expect(svg.selectAll("text.y-axis-label").size()).toBe(1);
  });
});