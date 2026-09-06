import { afterEach, describe, expect, it } from "vitest";

import { scaleLinear, select } from "d3";

import { FEATURE_REGISTRY } from "@/chart/featureRegistry.mjs";
import type { FeatureDefinition } from "@/chart/featureRegistry.mjs";
import type { FeatureRenderContext } from "@/chart/featureRegistry.mjs";
import type { ReferenceLine } from "@/components/referenceLines.mjs";
import type { ChartAnnotation } from "@/components/annotations.mjs";
import type { BoundsSelection, SVGSelection } from "@/types/index.mjs";

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

describe("referenceLines onZoomRedraw", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("re-renders horizontal reference line at position derived from the NEW zoomed scales", () => {
    const referenceLinesDef = FEATURE_REGISTRY.find((f) => f.key === "referenceLines") as FeatureDefinition<"referenceLines">;
    expect(referenceLinesDef.onZoomRedraw).toBeTypeOf("function");

    const xScale = scaleLinear().domain([0, 100]).range([0, 200]);
    const yScale = scaleLinear().domain([0, 100]).range([100, 0]);
    // A 2x zoom halves the visible domain (zoom in 2x):
    const newX = scaleLinear().domain([0, 50]).range([0, 200]);
    const newY = scaleLinear().domain([0, 50]).range([100, 0]);

    const { content } = createMockSVG();

    const lines: ReferenceLine[] = [{ axis: "y", value: 50 }];

    // Build the minimal FeatureRenderContext stub
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
        xSerie: { accessor: (d: unknown) => d },
      } as unknown as FeatureRenderContext<unknown>["config"],
      container: document.createElement("div"),
      content,
      flags: { hasReferenceLines: true } as unknown as FeatureRenderContext<unknown>["flags"],
      margins: dims.margins,
      reducedMotion: false,
      resolvedCurve: scaleLinear().interpolate() as unknown as FeatureRenderContext<unknown>["resolvedCurve"],
      state: {
        referenceLinesOptions: { lines },
      } as unknown as FeatureRenderContext<unknown>["state"],
      svg: select(document.createElementNS("http://www.w3.org/2000/svg", "svg")) as unknown as SVGSelection,
      xScale,
      xType: "linear",
      yScale,
    } as unknown as FeatureRenderContext<unknown>;

    // First render via the def's render()
    referenceLinesDef.render!(ctx, dims);

    const lineBefore = content.select("line.reference-line-stroke");
    expect(lineBefore.size()).toBe(1);
    const y1Before = Number(lineBefore.attr("y1"));

    // Original scales: y=50 maps to y1=50 (domain [0,100] → range [100,0])
    expect(y1Before).toBe(50);

    // onZoomRedraw with zoomed-in scales (domain halved = 2x zoom)
    referenceLinesDef.onZoomRedraw?.(ctx, dims, newX, newY);

    const lineAfter = content.select("line.reference-line-stroke");
    expect(lineAfter.size()).toBe(1);
    const y1After = Number(lineAfter.attr("y1"));

    // New scales: y=50 maps to y1=50 still (domain [0,50] → range [100,0] - same value)
    // But actually with newY, y=50 in domain [0,50] maps to... let me recalculate
    // newY(50) with domain [0,50] range [100,0] = 100 - 100*(50-0)/(50-0) = 0
    // Wait that's wrong. Let me think again.
    // range is [100, 0], so y1 = 100 - (value - 0) / (50 - 0) * (100 - 0) = 100 - 1*100 = 0
    // So y1 should be 0
    expect(y1After).toBe(0);
  });
});

describe("annotations onZoomRedraw", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("re-renders annotation at position derived from the NEW zoomed scales", () => {
    const annotationsDef = FEATURE_REGISTRY.find((f) => f.key === "annotations") as FeatureDefinition<"annotations">;
    expect(annotationsDef.onZoomRedraw).toBeTypeOf("function");

    const xScale = scaleLinear().domain([0, 100]).range([0, 200]);
    const yScale = scaleLinear().domain([0, 100]).range([100, 0]);
    // A 2x zoom halves the visible domain (zoom in 2x):
    const newX = scaleLinear().domain([0, 50]).range([0, 200]);
    const newY = scaleLinear().domain([0, 50]).range([100, 0]);

    const { content } = createMockSVG();

    const annotations: ChartAnnotation[] = [{ x: 25, y: 25, text: "Test", showConnector: true }];

    // Build the minimal FeatureRenderContext stub
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
        xSerie: { accessor: (d: unknown) => d },
      } as unknown as FeatureRenderContext<unknown>["config"],
      container: document.createElement("div"),
      content,
      flags: { hasAnnotations: true } as unknown as FeatureRenderContext<unknown>["flags"],
      margins: dims.margins,
      reducedMotion: false,
      resolvedCurve: scaleLinear().interpolate() as unknown as FeatureRenderContext<unknown>["resolvedCurve"],
      state: {
        annotationsOptions: { annotations },
      } as unknown as FeatureRenderContext<unknown>["state"],
      svg: select(document.createElementNS("http://www.w3.org/2000/svg", "svg")) as unknown as SVGSelection,
      xScale,
      xType: "linear",
      yScale,
    } as unknown as FeatureRenderContext<unknown>;

    // First render via the def's render()
    annotationsDef.render!(ctx, dims);

    const textBefore = content.select("text.annotation-text");
    expect(textBefore.size()).toBe(1);
    const xBefore = Number(textBefore.attr("x"));
    const yBefore = Number(textBefore.attr("y"));

    // Original scales: x=25 maps to 50, y=25 maps to 75, with dx=8, dy=-8
    // text at (ax+dx, ay+dy) = (50+8, 75-8) = (58, 67)
    expect(xBefore).toBe(58);
    expect(yBefore).toBe(67);

    // onZoomRedraw with zoomed-in scales (domain halved = 2x zoom)
    annotationsDef.onZoomRedraw?.(ctx, dims, newX, newY);

    const textAfter = content.select("text.annotation-text");
    expect(textAfter.size()).toBe(1);
    const xAfter = Number(textAfter.attr("x"));
    const yAfter = Number(textAfter.attr("y"));

    // New scales: x=25 maps to 100, y=25 maps to 50, with dx=8, dy=-8
    // text at (ax+dx, ay+dy) = (100+8, 50-8) = (108, 42)
    expect(xAfter).toBe(108);
    expect(yAfter).toBe(42);
  });
});
