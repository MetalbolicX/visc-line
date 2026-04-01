import { select } from "d3";
import type { Selection } from "d3";
import type {
  AnyScale,
  BoundsSelection,
  ProcessedSeries,
} from "@/types/index.mjs";

/** Options for {@link renderPoints}. */
interface RenderPointsOptions {
  radius?: number;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
}

/**
 * Renders circle points for multiple series into the provided bounds group using D3 selections and join.
 *
 * @template T - Datum type for series points.
 * @param boundsGroup - Parent bounds selection (typically a <g>) to which series groups will be appended/updated.
 * @param series - Array of processed series; each item is expected to include a label, a data array and an accessor for y-values.
 * @param xScale - Scale function for x-values; receives xAccessor(d) and must return a pixel x coordinate.
 * @param yScale - Scale function for y-values; receives series.accessor(d) and must return a pixel y coordinate.
 * @param xAccessor - Function that extracts the x-value from a datum.
 * @param options - Optional rendering settings.
 * @param options.radius - Radius of rendered circles in pixels. Default: 4.
 * @param options.stroke - Stroke color for circles. Default: "white".
 * @param options.strokeWidth - Stroke width in pixels. Default: 1.5.
 * @param options.opacity - Opacity for circles. Default: 0.85.
 * @returns D3 Selection of series group elements: Selection<SVGGElement, ProcessedSeries<T>, SVGGElement, null>.
 *
 * @remarks
 * - Creates one <g> per series with classes "point-series" and "point-series--{label}".
 * - Binds each series' data using xAccessor and joins to <circle class="point"> elements.
 * - Circle fill defaults to series.stroke if present, otherwise "steelblue".
 * - This function mutates the DOM via D3 and is intended for imperative rendering.
 */
export const renderPoints = <T,>(
  boundsGroup: BoundsSelection,
  series: ProcessedSeries<T>[],
  xScale: AnyScale,
  yScale: AnyScale,
  xAccessor: (d: T) => unknown,
  {
    radius = 4,
    stroke = "white",
    strokeWidth = 1.5,
    opacity = 0.85,
  }: RenderPointsOptions = {},
): Selection<SVGGElement, ProcessedSeries<T>, SVGGElement, null> =>
  boundsGroup
    .selectAll<SVGGElement, ProcessedSeries<T>>("g.point-series")
    .data(series, ({ label }) => label)
    .join("g")
    .attr("class", ({ label }) => `point-series point-series--${label}`)
    .each(function (serie) {
      select(this)
        .selectAll<SVGCircleElement, T>("circle.point")
        .data(serie.data, xAccessor as never)
        .join("circle")
        .attr("class", "point")
        .attr("cx", (d) => (xScale as (v: unknown) => number)(xAccessor(d)))
        .attr("cy", (d) =>
          (yScale as (v: unknown) => number)(serie.accessor(d)),
        )
        .attr("r", radius)
        .attr("fill", serie.stroke ?? "steelblue")
        .attr("stroke", stroke)
        .attr("stroke-width", strokeWidth)
        .attr("opacity", opacity);
    });
