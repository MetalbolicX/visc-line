import { select } from "d3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { BoundsSelection, SVGSelection } from "../../types/index.mjs";

import {
  cleanupAllEnhancements,
  clearOptionalNodes,
} from "../chartLifecycle.mjs";

describe("chartLifecycle", () => {
  let container: HTMLElement;
  let svgEl: SVGSVGElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    container.appendChild(svgEl);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("clearOptionalNodes removes optional nodes when features are disabled", () => {
    svgEl.innerHTML = [
      "<g class='bounds'>",
      "  <g class='x-axis'></g>",
      "  <g class='y-axis'></g>",
      "  <line class='grid-x'></line>",
      "  <line class='grid-y'></line>",
      "  <g class='point-series'></g>",
      "</g>",
      "<text class='x-axis-label'>x</text>",
      "<text class='y-axis-label'>y</text>",
      "<text class='chart-title'>title</text>",
      "<g class='legend'></g>",
    ].join("");

    const bounds = select(svgEl).select<SVGGElement>("g.bounds") as BoundsSelection;
    const svg = select(svgEl) as SVGSelection;

    clearOptionalNodes(
      bounds,
      svg,
      {
        hasAxes: false,
        hasGrid: false,
        hasLegend: false,
        hasPoints: false,
        hasTitle: false,
        hasTooltip: false,
        hasZoomPan: false,
      },
    );

    expect(svgEl.querySelector("g.x-axis")).toBeNull();
    expect(svgEl.querySelector("g.y-axis")).toBeNull();
    expect(svgEl.querySelector("line.grid-x")).toBeNull();
    expect(svgEl.querySelector("line.grid-y")).toBeNull();
    expect(svgEl.querySelector("g.point-series")).toBeNull();
    expect(svgEl.querySelector("text.x-axis-label")).toBeNull();
    expect(svgEl.querySelector("text.y-axis-label")).toBeNull();
    expect(svgEl.querySelector("text.chart-title")).toBeNull();
    expect(svgEl.querySelector("g.legend")).toBeNull();
  });

  it("clearOptionalNodes keeps optional nodes when features are enabled", () => {
    svgEl.innerHTML = [
      "<g class='bounds'>",
      "  <g class='x-axis'></g>",
      "  <g class='y-axis'></g>",
      "  <line class='grid-x'></line>",
      "  <line class='grid-y'></line>",
      "  <g class='point-series'></g>",
      "</g>",
      "<text class='x-axis-label'>x</text>",
      "<text class='y-axis-label'>y</text>",
      "<text class='chart-title'>title</text>",
      "<g class='legend'></g>",
    ].join("");

    const bounds = select(svgEl).select<SVGGElement>("g.bounds") as BoundsSelection;
    const svg = select(svgEl) as SVGSelection;

    clearOptionalNodes(
      bounds,
      svg,
      {
        hasAxes: true,
        hasGrid: true,
        hasLegend: true,
        hasPoints: true,
        hasTitle: true,
        hasTooltip: true,
        hasZoomPan: true,
      },
    );

    expect(svgEl.querySelector("g.x-axis")).toBeTruthy();
    expect(svgEl.querySelector("g.y-axis")).toBeTruthy();
    expect(svgEl.querySelector("line.grid-x")).toBeTruthy();
    expect(svgEl.querySelector("line.grid-y")).toBeTruthy();
    expect(svgEl.querySelector("g.point-series")).toBeTruthy();
    expect(svgEl.querySelector("text.x-axis-label")).toBeTruthy();
    expect(svgEl.querySelector("text.y-axis-label")).toBeTruthy();
    expect(svgEl.querySelector("text.chart-title")).toBeTruthy();
    expect(svgEl.querySelector("g.legend")).toBeTruthy();
  });

  it("cleanupAllEnhancements invokes zoom cleanup callback", () => {
    svgEl.innerHTML = "<g class='bounds'></g>";
    const bounds = select(svgEl).select<SVGGElement>("g.bounds") as BoundsSelection;
    const svg = select(svgEl) as SVGSelection;
    const onZoomPanCleared = vi.fn();

    cleanupAllEnhancements(bounds, svg, onZoomPanCleared);

    expect(onZoomPanCleared).toHaveBeenCalledTimes(1);
  });
});
