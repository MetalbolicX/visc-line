import { scaleLinear, select } from "d3";
import { afterEach, describe, expect, it } from "vitest";

import { renderEndLabels, resolveCollisions } from "../endLabels.mjs";

describe("renderEndLabels", () => {
  afterEach(() => document.body.replaceChildren());

  it("renders one direct label per series at its last x value", () => {
    const content = select(document.body).append("svg").append("g") as any;
    const series = [
      { accessor: (datum: { x: number; y: number }) => datum.y, data: [{ x: 1, y: 10 }, { x: 2, y: 20 }], label: "A" },
      { accessor: (datum: { x: number; y: number }) => datum.y, data: [{ x: 1, y: 30 }, { x: 2, y: 40 }], label: "B" },
    ] as any;
    renderEndLabels(content, series, scaleLinear().domain([0, 2]).range([0, 200]), scaleLinear().domain([0, 40]).range([200, 0]), (datum: any) => datum.x, {});
    const labels = content.selectAll("text.end-label");
    expect(labels.size()).toBe(2);
    expect(labels.nodes().map((node: SVGTextElement) => node.textContent)).toEqual(["A", "B"]);
    expect(labels.nodes().map((node: SVGTextElement) => node.getAttribute("x"))).toEqual(["208", "208"]);
    expect(labels.nodes().map((node: SVGTextElement) => node.getAttribute("y"))).toEqual(["100", "0"]);
  });

  it("applies a format override", () => {
    const content = select(document.body).append("svg").append("g") as any;
    const series = [{ accessor: (datum: { x: number; y: number }) => datum.y, data: [{ x: 1, y: 20 }], label: "A" }] as any;
    renderEndLabels(content, series, scaleLinear().domain([0, 1]).range([0, 100]), scaleLinear().domain([0, 20]).range([100, 0]), (datum: any) => datum.x, { format: (label, value) => `${label}: ${value}` });
    expect(content.select("text.end-label").text()).toBe("A: 20");
  });
});

describe("resolveCollisions", () => {
  const mk = (label: string, y: number, height = 16) => ({ label, y, height, node: null as any });
  const bounds = { minY: 0, maxY: 200, lineHeight: 18 };

  it('"nudge": pushes overlapping labels apart vertically', () => {
    const result = resolveCollisions([mk("A", 100), mk("B", 104)], "nudge", bounds);
    expect(result.dropped).toEqual([]);
    const ys = result.kept.map((kept) => kept.y).sort((a, b) => a - b);
    expect(ys[1] - ys[0]).toBeGreaterThanOrEqual(bounds.lineHeight);
  });

  it('"nudge": drops unresolvable labels and reports them', () => {
    const labels = [mk("A", 0), mk("B", 1), mk("C", 2), mk("D", 3), mk("E", 4)];
    const result = resolveCollisions(labels, "nudge", { minY: 0, maxY: 30, lineHeight: 18 });
    expect(result.kept.length).toBeLessThan(5);
    expect(result.dropped.length).toBeGreaterThan(0);
  });

  it('"hide": skips overlapping labels, no nudge', () => {
    const result = resolveCollisions([mk("A", 100), mk("B", 104), mk("C", 108)], "hide", bounds);
    for (let index = 1; index < result.kept.length; index++) {
      expect(result.kept[index].y - result.kept[index - 1].y).toBeGreaterThanOrEqual(bounds.lineHeight);
    }
  });

  it('"legend": returns zero labels when collision detected', () => {
    const result = resolveCollisions([mk("A", 100), mk("B", 104)], "legend", bounds);
    expect(result.kept).toEqual([]);
    expect(result.dropped).toEqual(["A", "B"]);
  });

  it('"legend": renders labels normally when no collision', () => {
    const result = resolveCollisions([mk("A", 0), mk("B", 100)], "legend", bounds);
    expect(result.kept.length).toBe(2);
  });
});
