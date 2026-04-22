import type { Selection } from "d3";

import { select } from "d3";

import type {
  AnyScale,
  BoundsSelection,
  ProcessedSeries,
} from "@/types/index.mjs";

/** Options for {@link renderPoints}. */
interface RenderPointsOptions {
  fill?: string;
  opacity?: number;
  radius?: number;
  stroke?: string;
  strokeWidth?: number;
}

/**
 * Renders point markers for one or more series into the provided bounds group.
 *
 * This function performs a D3 data-join: it binds the supplied `series` array
 * to child <g> elements with class `point-series`, and for each series joins
 * that series' `data` to <circle.point> elements. Attributes (cx, cy, r,
 * fill, stroke, stroke-width, opacity) are set on the circles. The function
 * mutates the DOM and is idempotent when called repeatedly with the same
 * inputs (D3 join semantics).
 *
 * Type notes:
 * - T is the datum type for each point in a series.
 * - `xAccessor` extracts the x-value from a datum and is also used as the
 *   key function for joining points within a series.
 * - `series` entries are expected to have a unique `label` property used as
 *   the series-level key in the outer join.
 *
 * @typeParam T - Item type for series data points.
 * @param boundsGroup - The D3 selection representing the chart plotting area
 *   (a group element) where point series groups will be appended/updated.
 * @param series - Array of processed series; each series must include `data`,
 *   an `accessor` for the y-value, and a `label` used as the series key.
 * @param xScale - D3 scale used to compute the circle `cx` from the
 *   `xAccessor` result.
 * @param yScale - D3 scale used to compute the circle `cy` from the series'
 *   `accessor` result.
 * @param xAccessor - Function that returns the x value for a point datum;
 *   also used as the per-point key for the inner join.
 * @param options - Optional visual tuning for point appearance (fill,
 *   opacity, radius, stroke, strokeWidth). Defaults are provided.
 * @returns A D3 selection containing the series <g> elements created/updated
 *   under `boundsGroup`.
 * @example
 * ```ts
 * renderPoints(bounds, mySeries, xScale, yScale, d => d.time, { radius: 3 });
 * ```
 */
const renderPoints = <T,>(
  boundsGroup: BoundsSelection,
  series: ProcessedSeries<T>[],
  xScale: AnyScale,
  yScale: AnyScale,
  xAccessor: (d: T) => unknown,
  {
    fill = "var(--vl-point-fill, steelblue)",
    opacity = 0.85,
    radius = 4,
    stroke = "var(--vl-point-stroke, white)",
    strokeWidth = 1.5,
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
        .attr("fill", serie.stroke ?? fill)
        .attr("stroke", stroke)
        .attr("stroke-width", strokeWidth)
        .attr("opacity", opacity);
    });
