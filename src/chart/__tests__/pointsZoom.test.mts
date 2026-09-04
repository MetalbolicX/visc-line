import { afterEach, describe, expect, it } from "vitest";

import { scaleLinear, select } from "d3";

import { FEATURE_REGISTRY } from "@/chart/featureRegistry.mjs";
import type { FeatureDefinition } from "@/chart/featureRegistry.mjs";
import type { FeatureRenderContext } from "@/chart/featureRegistry.mjs";
import type { ProcessedSeries } from "@/types/index.mjs";
import type { BoundsSelection, SVGSelection } from "@/types/index.mjs";

interface TestPoint {
  readonly x: number;
  readonly y: number;
}

const createMockSVG = (): { container: HTMLDivElement; svg: SVGSVGElement; content: BoundsSelection } => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGSVGElement;
  container.appendChild(svgEl);
  const svg = select(svgEl) as unknown as SVGSelection;
  const bounds = svg.append("g").attr("class", "bounds") as unknown as BoundsSelection;
  const content = bounds.append("g").attr("class", "content") as unknown as BoundsSelection;
  return { container, svg: svgEl, content };
};

const dims = {
  height: 100,
  innerHeight: 100,
  innerWidth: 200,
  margins: { bottom: 0, left: 0, right: 0, top: 0 },
  width: 200,
};

describe("points onZoomRedraw", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("re-renders points at positions derived from the NEW zoomed scales", () => {
    const pointsDef = FEATURE_REGISTRY.find((f) => f.key === "points") as FeatureDefinition<"points">;
    expect(pointsDef.onZoomRedraw).toBeTypeOf("function");

    const xScale = scaleLinear().domain([0, 100]).range([0, 200]);
    const yScale = scaleLinear().domain([0, 100]).range([100, 0]);
    // A 2x zoom halves the visible domain (zoom in 2x):
    const newX = scaleLinear().domain([0, 50]).range([0, 200]);
    const newY = scaleLinear().domain([0, 50]).range([100, 0]);

    const { content } = createMockSVG();

    const series: ProcessedSeries<TestPoint>[] = [
      {
        label: "points-a",
        accessor: (d: TestPoint) => d.y,
        data: [
          { x: 25, y: 25 },
        ],
      },
    ];

    // Build the minimal FeatureRenderContext stub needed for render + onZoomRedraw
    const ctx = {
      allSeriesExtents: {
        xDomain: [0, 100] as const,
        yDomain: [0, 100] as const,
      },
      bounds: content,
      callbacks: {
        onCustomCleanupChange: () => {},
        onZoomBehaviorChange: () => {},
      },
      clipPathId: "clip",
      config: {
        accessibility: { describedBy: [] },
        animation: { duration: 0 },
        xSerie: { accessor: (d: TestPoint) => d.x },
      } as unknown as FeatureRenderContext<TestPoint>["config"],
      container: document.createElement("div"),
      content,
      flags: { hasPoints: true } as unknown as FeatureRenderContext<TestPoint>["flags"],
      margins: dims.margins,
      reducedMotion: false,
      resolvedCurve: scaleLinear().interpolate() as unknown as FeatureRenderContext<TestPoint>["resolvedCurve"],
      state: {
        currentSeries: series,
      } as unknown as FeatureRenderContext<TestPoint>["state"],
      svg: select(document.createElementNS("http://www.w3.org/2000/svg", "svg")) as unknown as SVGSelection,
      xScale,
      xType: "linear",
      yScale,
    } as unknown as FeatureRenderContext<TestPoint>;

    // First render via the entry's render() — establishes circles at positions from original scales
    pointsDef.render!(ctx, dims);

    const circleBefore = content.select("circle.point");
    expect(circleBefore.size()).toBe(1);
    const cxBefore = Number(circleBefore.attr("cx"));
    const cyBefore = Number(circleBefore.attr("cy"));

    // Original scales: x=25 maps to cx=50 (domain [0,100] → range [0,200])
    expect(cxBefore).toBe(50);
    expect(cyBefore).toBe(75); // y=25 maps to cy=75 (domain [0,100] → range [100,0])

    // onZoomRedraw with zoomed-in scales (domain halved = 2x zoom)
    pointsDef.onZoomRedraw?.(ctx, dims, newX, newY);

    const circleAfter = content.select("circle.point");
    expect(circleAfter.size()).toBe(1);
    const cxAfter = Number(circleAfter.attr("cx"));
    const cyAfter = Number(circleAfter.attr("cy"));

    // New scales: x=25 maps to cx=100 (domain [0,50] → range [0,200])
    // The bug: onZoomRedraw uses stale ctx.xScale → cx stays 50
    // The fix: onZoomRedraw uses newX → cx becomes 100
    expect(cxAfter).toBe(100);
    expect(cyAfter).toBe(50); // y=25 maps to cy=50 (domain [0,50] → range [100,0])
  });
});
