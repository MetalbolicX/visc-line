import { curveLinear, line, select } from "d3";
import type { CurveFactory, Selection } from "d3";
import type {
  AnyScale,
  BoundsSelection,
  ProcessedSeries,
} from "@/types/index.mjs";

/** Options for {@link renderLine}. */
interface RenderLineOptions {
  /** D3 curve factory used by the line generator. Defaults to {@link curveLinear}. */
  curve?: CurveFactory;
  strokeWidth?: number;
  transitionDuration?: number;
}

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
    strokeWidth = 2,
    transitionDuration = 1000,
  }: RenderLineOptions = {},
): Selection<SVGPathElement, ProcessedSeries<T>, SVGGElement, null> => {
  const buildPath = (serie: ProcessedSeries<T>): string | null =>
    line<T>()
      .curve(curve)
      .x((d) => (xScale as (v: unknown) => number)(xAccessor(d)))
      .y((d) => (yScale as (v: unknown) => number)(serie.accessor(d)))(
      serie.data,
    );

  return boundsGroup
    .selectAll<SVGPathElement, ProcessedSeries<T>>("path.chart-line")
    .data(series, (d) => d.label)
    .join(
      (enter) =>
        enter
          .append("path")
          .attr("class", (d) => `chart-line chart-line--${d.label}`)
          .attr("fill", "none")
          .attr("stroke", (d) => d.stroke ?? "steelblue")
          .attr(
            "stroke-width",
            (d) => (d.strokeWidth as number | undefined) ?? strokeWidth,
          )
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("d", (d) => buildPath(d))
          .each(function () {
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
            .transition()
            .duration(transitionDuration)
            .attr("d", newPathD)
            .attr("stroke", d.stroke ?? "steelblue")
            .attr("stroke-dashoffset", 0);
        }),
      (exit) => exit.remove(),
    );
};
