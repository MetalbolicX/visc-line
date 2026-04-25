import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { select } from "d3";
import type { SVGSelection } from "@/types/index.mjs";
import { scaleLinear } from "d3";

import { addZoomPan } from "@/interactivity/zoomPan.mjs";

describe("addZoomPan", () => {
  const createMockSVG = (): SVGSelection => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    container.appendChild(svgEl);
    return select(svgEl as SVGSVGElement) as unknown as SVGSelection;
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("returns a zoom behavior with reset method", () => {
    const svg = createMockSVG();
    const xScale = scaleLinear().domain([0, 100]).range([0, 800]);
    const yScale = scaleLinear().domain([0, 50]).range([200, 0]);
    const zoomBehavior = addZoomPan(svg, {
      innerHeight: 200,
      innerWidth: 800,
      onZoom: vi.fn(),
      xScale,
      yScale,
    });
    expect(typeof zoomBehavior.reset).toBe("function");
  });

  it("reset method restores zoom identity", () => {
    const svg = createMockSVG();
    const xScale = scaleLinear().domain([0, 100]).range([0, 800]);
    const yScale = scaleLinear().domain([0, 50]).range([200, 0]);
    const zoomBehavior = addZoomPan(svg, {
      innerHeight: 200,
      innerWidth: 800,
      onZoom: vi.fn(),
      xScale,
      yScale,
    });
    const transformSpy = vi.spyOn(zoomBehavior, "transform" as never);
    zoomBehavior.reset();
    expect(transformSpy).toHaveBeenCalled();
  });

  it("calls onZoom callback when zoom is triggered via scaleBy", () => {
    const svg = createMockSVG();
    const xScale = scaleLinear().domain([0, 100]).range([0, 800]);
    const yScale = scaleLinear().domain([0, 50]).range([200, 0]);
    const onZoom = vi.fn();
    const zoomBehavior = addZoomPan(svg, {
      innerHeight: 200,
      innerWidth: 800,
      onZoom,
      xScale,
      yScale,
    });
    vi.advanceTimersByTime(0);
    zoomBehavior.scaleBy(svg as never, 2);
    vi.advanceTimersByTime(0);
    expect(onZoom).toHaveBeenCalled();
  });

  it("is idempotent — attaching zoom twice does not break", () => {
    const svg = createMockSVG();
    const xScale = scaleLinear().domain([0, 100]).range([0, 800]);
    const yScale = scaleLinear().domain([0, 50]).range([200, 0]);
    const onZoom = vi.fn();
    const zoomBehavior = addZoomPan(svg, {
      innerHeight: 200,
      innerWidth: 800,
      onZoom,
      xScale,
      yScale,
    });
    addZoomPan(svg, {
      innerHeight: 200,
      innerWidth: 800,
      onZoom,
      xScale,
      yScale,
    });
    zoomBehavior.scaleBy(svg as never, 1.5);
    expect(onZoom).toHaveBeenCalled();
  });
});