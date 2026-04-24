import type { Selection } from "d3";

import { select } from "d3";

import type {
  AnyScale,
  BoundsSelection,
  ProcessedSeries,
} from "@/types/index.mjs";

/**
 * Renders point markers for one or more series into the provided bounds group.
 *
 * Visual appearance (fill, stroke, stroke-width, radius, opacity) is fully
 * controlled by CSS custom properties set via {@link applyThemeCssVars}. Each
 * attribute defaults to a `var(--vl-*)` reference so the active theme is
 * inherited automatically. The only exception is `r` (circle radius), which
 * is read as a number from `--vl-point-radius` at render time via
 * `getComputedStyle`.
 *
 * Per-series colour can be overridden through `SeriesDescriptor.stroke`; when
 * set it takes precedence over `--vl-point-fill` for that series only.
 *
 * @typeParam T - Item type for series data points.
 * @param boundsGroup - The D3 selection representing the chart plotting area
 *   where point series groups will be appended/updated.
 * @param series - Array of processed series; each must include `data`,
 *   an `accessor` for the y-value, and a `label` used as the series key.
 * @param xScale - D3 scale used to compute circle `cx` from the `xAccessor`.
 * @param yScale - D3 scale used to compute circle `cy` from the series accessor.
 * @param xAccessor - Function returning the x value for a datum; also used as
 *   the per-point key for the inner join.
 * @returns A D3 selection containing the series `<g>` elements.
 * @example
 * ```ts
 * renderPoints(bounds, mySeries, xScale, yScale, d => d.time);
 * ```
 */
export const renderPoints = <T,>(
  boundsGroup: BoundsSelection,
  series: readonly ProcessedSeries<T>[],
  xScale: AnyScale,
  yScale: AnyScale,
  xAccessor: (d: T) => unknown,
): Selection<SVGGElement, ProcessedSeries<T>, SVGGElement, null> => {
  const node = boundsGroup.node();
  const radius = node
    ? parseFloat(getComputedStyle(node).getPropertyValue("--vl-point-radius")) || 3
    : 3;

  return boundsGroup
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
        .attr("fill", serie.stroke ?? "var(--vl-point-fill, #ffffff)")
        .attr("stroke", "var(--vl-point-stroke, #333333)")
        .attr("stroke-width", "var(--vl-point-stroke-width, 1)")
        .attr("opacity", "var(--vl-point-opacity, 0.85)");
    });
};
