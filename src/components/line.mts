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

/**
 *
 */
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

/**
 *
 */
const resolveCurveFactory = (
  curve: CurveFactory | CurvePreset,
): CurveFactory => (typeof curve === "string" ? curveByName[curve] : curve);

/**
 * Renders and updates line series within a given bounds group using D3.
 *
 * @template T - The datum type for each point in the series.
 *
 * @param boundsGroup - A D3 selection representing the group (<g>) that contains the chart bounds where lines will be rendered.
 * @param series - Array of processed series to render. Each series should contain a label (used as the data key), stroke, strokeWidth, accessor, and data array.
 * @param xScale - A scale function used to map x values (produced by xAccessor) to pixel coordinates.
 * @param yScale - A scale function used to map y values (produced by each series' accessor) to pixel coordinates.
 * @param xAccessor - Function that extracts the x-value from a datum of type T.
 * @param options - Optional rendering options.
 * @param options.strokeWidth - Default stroke width to apply to lines when a series-specific strokeWidth is not provided. Default: 2.
 * @param options.transitionDuration - Duration in milliseconds for the entering/updating line draw animation. Default: 1000.
 *
 * @remarks
 * - Binds the provided series array to "path.chart-line" elements using the series' label as the key.
 * - For entering series, appends a <path> with class "chart-line chart-line--{label}", sets visual attributes (fill, stroke, stroke-width, linejoin, linecap)
 *   and the initial "d" path from the series data. It then animates the stroke drawing using stroke-dasharray/stroke-dashoffset from the path's total length.
 * - For updating series, recomputes the path "d", resets stroke dash attributes based on the current path length and transitions the path and stroke to the new values.
 * - For exiting series, removes the corresponding <path>.
 * - The path geometry is produced with a D3 line generator that uses xScale(xAccessor(d)) and yScale(series.accessor(d)).
 *
 * @returns A D3 Selection of the rendered SVGPathElement(s) bound to the provided ProcessedSeries<T> data.
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

  const buildPath = (serie: ProcessedSeries<T>): string | null =>
    line<T>()
      .curve(curveFactory)
      .x((d) => (xScale as (v: unknown) => number)(xAccessor(d)))
      .y((d) => (yScale as (v: unknown) => number)(serie.accessor(d)))(
      serie.data,
    );

  const reducedMotion =
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
          .attr(
            "stroke-width",
            (d) => d.strokeWidth ?? strokeWidth,
          )
          .attr("opacity", (d) => d.opacity ?? opacity)
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("d", (d) => buildPath(d))
          .each(function () {
            if (reducedMotion) return;
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
            .duration(reducedMotion ? 0 : transitionDuration)
            .attr("stroke-dashoffset", 0);
        }),
      (exit) => exit.remove(),
    );
};
