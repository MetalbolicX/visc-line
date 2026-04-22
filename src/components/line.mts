import type { CurveFactory, Selection } from "d3";

import {
  curveBasis,
  curveBasisClosed,
  curveBasisOpen,
  curveBumpX,
  curveBumpY,
  curveCardinal,
  curveCardinalClosed,
  curveCardinalOpen,
  curveCatmullRom,
  curveCatmullRomClosed,
  curveCatmullRomOpen,
  curveLinear,
  curveMonotoneX,
  curveMonotoneY,
  curveNatural,
  curveStep,
  curveStepAfter,
  curveStepBefore,
  line,
  select,
} from "d3";

import type {
  AnyScale,
  BoundsSelection,
  CurvePreset,
  ProcessedSeries,
} from "@/types/index.mjs";

/** Options for {@link renderLine}. */
interface RenderLineOptions {
  /** D3 curve factory used by the line generator. Defaults to {@link curveLinear}. */
  curve?: CurveFactory | CurvePreset;
  opacity?: number | string;
  reducedMotion?: boolean;
  strokeWidth?: number | string;
  transitionDuration?: number;
}

/** Mapping of curve preset names to D3 curve factories. */
const curveByName: Record<CurvePreset, CurveFactory> = {
  basis: curveBasis,
  basisClosed: curveBasisClosed,
  basisOpen: curveBasisOpen,
  bumpX: curveBumpX,
  bumpY: curveBumpY,
  cardinal: curveCardinal,
  cardinalClosed: curveCardinalClosed,
  cardinalOpen: curveCardinalOpen,
  catmullRom: curveCatmullRom,
  catmullRomClosed: curveCatmullRomClosed,
  catmullRomOpen: curveCatmullRomOpen,
  linear: curveLinear,
  monotoneX: curveMonotoneX,
  monotoneY: curveMonotoneY,
  natural: curveNatural,
  step: curveStep,
  stepAfter: curveStepAfter,
  stepBefore: curveStepBefore,
};

/** Resolve a curve factory from either a preset name or supplied factory function. */
const resolveCurveFactory = (
  curve: CurveFactory | CurvePreset,
): CurveFactory => (typeof curve === "string" ? curveByName[curve] : curve);

/**
 * Render and update SVG path elements for line series inside the provided bounds group.
 *
 * Binds the given series array to <path class="chart-line"> elements and manages
 * the enter / update / exit lifecycle. Uses a D3 line generator with a configurable
 * curve factory and supports animated stroke drawing via stroke-dashoffset. Respects
 * the user's reduced-motion preference or the `reducedMotion` option to disable
 * animations.
 *
 * @template T - Datum type for series points.
 * @param {BoundsSelection} boundsGroup - D3 group selection to contain the line paths.
 * @param {ProcessedSeries<T>[]} series - Array of processed series to render. Each series
 *   should include a unique `label`, `data`, and an `accessor` for y values; optional
 *   visual overrides: `stroke`, `strokeWidth`, `opacity`.
 * @param {AnyScale} xScale - Scale mapping x values (from xAccessor) to pixel positions.
 * @param {AnyScale} yScale - Scale mapping y values (from series.accessor) to pixel positions.
 * @param {(d: T) => unknown} xAccessor - Function extracting the x value from a datum.
 * @param {RenderLineOptions} [options] - Rendering options (curve factory or preset, stroke opacity/width,
 *   reducedMotion, transitionDuration).
 * @returns {Selection<SVGPathElement, ProcessedSeries<T>, SVGGElement, null>} A D3 selection of the path elements
 *   after the data join.
 *
 * @example
 * ```ts
 * renderLine(boundsGroup, series, xScale, yScale, d => d.x, { curve: 'monotoneX', transitionDuration: 500 });
 * ```
 */
export const renderLine = <T,>(
  boundsGroup: BoundsSelection,
  series: ProcessedSeries<T>[],
  xScale: AnyScale,
  yScale: AnyScale,
  xAccessor: (d: T) => unknown,
  {
    curve = curveLinear,
    opacity = "var(--vl-line-opacity, 1)",
    reducedMotion: reducedMotionOption = false,
    strokeWidth = "var(--vl-line-stroke-width, 2)",
    transitionDuration = 1000,
  }: RenderLineOptions = {},
): Selection<SVGPathElement, ProcessedSeries<T>, SVGGElement, null> => {
  const curveFactory = resolveCurveFactory(curve);

  /** Build a path 'd' attribute for a series using the configured curve factory. */
  const buildPath = (serie: ProcessedSeries<T>): null | string =>
    line<T>()
      .curve(curveFactory)
      .x((d) => (xScale as (v: unknown) => number)(xAccessor(d)))
      .y((d) => (yScale as (v: unknown) => number)(serie.accessor(d)))(
      serie.data,
    );

  const isMotionReduced =
    reducedMotionOption ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return boundsGroup
    .selectAll<SVGPathElement, ProcessedSeries<T>>("path.chart-line")
    .data(series, (d) => d.label)
    .join(
      (enter) =>
        enter
          .append("path")
          .attr("class", (d) => `chart-line chart-line--${d.label}`)
          .attr("fill", "none")
          .attr("stroke", (d) => d.stroke ?? "var(--vl-palette-0, steelblue)")
          .attr("stroke-width", (d) => d.strokeWidth ?? strokeWidth)
          .attr("opacity", (d) => d.opacity ?? opacity)
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("d", (d) => buildPath(d))
          .each(function () {
            if (isMotionReduced) return;
            const path = select(this);
            const totalLength = this.getTotalLength();
            path
              .attr("stroke-dasharray", totalLength)
              .attr("stroke-dashoffset", totalLength)
              .transition()
              .duration(transitionDuration)
              .attr("stroke-dashoffset", 0);
          }),
      (update) =>
        update.each(function (d) {
          const path = select(this);
          const newPathD = buildPath(d);
          const totalLength = this.getTotalLength();
          path
            .attr("stroke-dasharray", totalLength)
            .attr("stroke-dashoffset", totalLength)
            .attr("d", newPathD)
            .attr("stroke", d.stroke ?? "var(--vl-palette-0, steelblue)")
            .attr("opacity", d.opacity ?? opacity)
            .transition()
            .duration(isMotionReduced ? 0 : transitionDuration)
            .attr("stroke-dashoffset", 0);
        }),
      (exit) => exit.remove(),
    );
};
