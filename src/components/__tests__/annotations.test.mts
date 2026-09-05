import { describe, expect, it } from "vitest";

import { select } from "d3";

import { renderAnnotations } from "@/components/annotations.mjs";
import type { ChartAnnotation } from "@/components/annotations.mjs";
import { scaleLinear } from "d3";

describe("renderAnnotations", () => {
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

  it("renders one g.annotation per entry", () => {
    const selection = createMockBounds();
    const xScale = scaleLinear().domain([0, 100]).range([0, 800]);
    const yScale = scaleLinear().domain([0, 100]).range([200, 0]);
    const annotations: ChartAnnotation[] = [
      { x: 25, y: 50, text: "First" },
      { x: 50, y: 75, text: "Second" },
      { x: 75, y: 25, text: "Third" },
    ];
    renderAnnotations(selection, { annotations, xScale, yScale });
    const groups = selection.selectAll<SVGGElement, ChartAnnotation>("g.annotation");
    expect(groups.size()).toBe(3);
  });

  it("renders text at anchor + offset with defaults applied", () => {
    const selection = createMockBounds();
    const xScale = scaleLinear().domain([0, 100]).range([0, 800]);
    const yScale = scaleLinear().domain([0, 100]).range([200, 0]);
    const annotations: ChartAnnotation[] = [{ x: 50, y: 50, text: "Test" }];
    renderAnnotations(selection, { annotations, xScale, yScale });
    const text = selection.select<SVGTextElement>("text.annotation-text");
    expect(text.size()).toBeGreaterThan(0);
    // xScale(50) = 400, yScale(50) = 100, dx=8, dy=-8
    // text at (ax + dx, ay + dy) = (408, 92)
    expect(text.attr("x")).toBe("408");
    expect(text.attr("y")).toBe("92");
    expect(text.attr("dy")).toBe("0.32em");
    expect(text.text()).toBe("Test");
  });

  it("uses text-anchor start for dx >= 0, end for negative dx", () => {
    const selection = createMockBounds();
    const xScale = scaleLinear().domain([0, 100]).range([0, 800]);
    const yScale = scaleLinear().domain([0, 100]).range([200, 0]);

    // dx positive
    const ann1: ChartAnnotation[] = [{ x: 50, y: 50, text: "Pos", dx: 8 }];
    renderAnnotations(selection, { annotations: ann1, xScale, yScale });
    expect(selection.select<SVGTextElement>("text.annotation-text").attr("text-anchor")).toBe("start");

    // dx negative
    const ann2: ChartAnnotation[] = [{ x: 50, y: 50, text: "Neg", dx: -8 }];
    selection.selectAll("g.annotation").remove();
    renderAnnotations(selection, { annotations: ann2, xScale, yScale });
    expect(selection.select<SVGTextElement>("text.annotation-text").attr("text-anchor")).toBe("end");
  });

  it("renders connector line only when showConnector is true", () => {
    const selection = createMockBounds();
    const xScale = scaleLinear().domain([0, 100]).range([0, 800]);
    const yScale = scaleLinear().domain([0, 100]).range([200, 0]);

    // Without connector
    const ann1: ChartAnnotation[] = [{ x: 50, y: 50, text: "No connector" }];
    renderAnnotations(selection, { annotations: ann1, xScale, yScale });
    let connector = selection.select<SVGLineElement>("line.annotation-connector");
    expect(connector.size()).toBe(0);

    // With connector
    const ann2: ChartAnnotation[] = [{ x: 50, y: 50, text: "With connector", showConnector: true }];
    selection.selectAll("g.annotation").remove();
    renderAnnotations(selection, { annotations: ann2, xScale, yScale });
    connector = selection.select<SVGLineElement>("line.annotation-connector");
    expect(connector.size()).toBe(1);
    // Connector from anchor (400, 100) to anchor + offset (408, 92)
    expect(connector.attr("x1")).toBe("400");
    expect(connector.attr("y1")).toBe("100");
    expect(connector.attr("x2")).toBe("408");
    expect(connector.attr("y2")).toBe("92");
  });

  it("is idempotent on re-render", () => {
    const selection = createMockBounds();
    const xScale = scaleLinear().domain([0, 100]).range([0, 800]);
    const yScale = scaleLinear().domain([0, 100]).range([200, 0]);
    const annotations: ChartAnnotation[] = [{ x: 50, y: 50, text: "Test" }];
    renderAnnotations(selection, { annotations, xScale, yScale });
    const groupCount = selection.selectAll("g.annotation").size();
    renderAnnotations(selection, { annotations, xScale, yScale });
    expect(selection.selectAll("g.annotation").size()).toBe(groupCount);
  });

  it("uses CSS variable styling on text", () => {
    const selection = createMockBounds();
    const xScale = scaleLinear().domain([0, 100]).range([0, 800]);
    const yScale = scaleLinear().domain([0, 100]).range([200, 0]);
    const annotations: ChartAnnotation[] = [{ x: 50, y: 50, text: "Test" }];
    renderAnnotations(selection, { annotations, xScale, yScale });
    const text = selection.select<SVGTextElement>("text.annotation-text");
    expect(text.attr("fill")).toBe("var(--vl-annotation-text-fill, #334155)");
    expect(text.attr("font-size")).toBe("var(--vl-annotation-text-font-size, 12px)");
  });

  it("uses CSS variable styling on connector", () => {
    const selection = createMockBounds();
    const xScale = scaleLinear().domain([0, 100]).range([0, 800]);
    const yScale = scaleLinear().domain([0, 100]).range([200, 0]);
    const annotations: ChartAnnotation[] = [{ x: 50, y: 50, text: "Test", showConnector: true }];
    renderAnnotations(selection, { annotations, xScale, yScale });
    const connector = selection.select<SVGLineElement>("line.annotation-connector");
    expect(connector.attr("stroke")).toBe("var(--vl-annotation-connector-stroke, #94a3b8)");
    expect(connector.attr("stroke-width")).toBe("var(--vl-annotation-connector-stroke-width, 1)");
    expect(connector.attr("stroke-dasharray")).toBe("var(--vl-annotation-connector-dash-array, 2 3)");
  });

  it("skips entries with non-finite anchor", () => {
    const selection = createMockBounds();
    const xScale = scaleLinear().domain([0, 100]).range([0, 800]);
    const yScale = scaleLinear().domain([0, 100]).range([200, 0]);
    const annotations: ChartAnnotation[] = [
      { x: 50, y: 50, text: "Valid" },
      { x: 9999, y: 50, text: "Invalid" }, // x outside domain
    ];
    renderAnnotations(selection, { annotations, xScale, yScale });
    // Both groups exist, but invalid one has hidden text
    const visibleText = selection.select<SVGTextElement>("text.annotation-text:not([visibility='hidden'])");
    expect(visibleText.size()).toBe(1);
  });
});
