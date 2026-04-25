import type { CurveFactory, Selection } from "d3";

import { line, select } from "d3";

import type { AnyScale, BoundsSelection, CurvePreset, ProcessedSeries } from "@/types/index.mjs";
import { resolveCurve } from "@/utils/index.mjs";
import { asScaleNumber } from "@/utils/scaleCast.mjs";

/** Options for {@link renderLine}. */
export interface RenderLineOptions {
  /**
   * D3 curve factory or preset name used by the line generator.
   * Defaults to `"linear"`. Accepts any {@link CurvePreset} string or a
   * D3 `CurveFactory` object.
   */
  readonly curve?: CurveFactory | CurvePreset;
  /**
   * When `true`, all stroke-dashoffset animations are skipped. When omitted
   * the function also checks `window.matchMedia("prefers-reduced-motion: reduce")`.
   */
  readonly reducedMotion?: boolean;
  /** Animation duration in milliseconds (default: 1000). */
  readonly transitionDuration?: number;
}

/**
 * Render and update SVG path elements for line series inside the provided bounds group.
 *
 * Visual appearance (stroke colour, stroke-width, opacity) is controlled
 * entirely by CSS custom properties written by {@link applyThemeCssVars}:
 * - `--vl-line-stroke-width` — line stroke width
 * - `--vl-line-opacity` — line opacity
 * - `--vl-palette-N` — per-palette-index stroke colour fallback
 *
 * Per-series colour can be overridden through `SeriesDescriptor.stroke`; when
 * set it takes precedence over the palette CSS variable for that series only.
 * Per-series `strokeWidth` and `opacity` overrides on `SeriesDescriptor` are
 * also respected and win over the theme values.
 *
 * @template T - Datum type for series points.
 * @param boundsGroup - D3 group selection to contain the line paths.
 * @param series - Array of processed series.
 * @param xScale - Scale mapping x values to pixel positions.
 * @param yScale - Scale mapping y values to pixel positions.
 * @param xAccessor - Function extracting the x value from a datum.
 * @param options - Behavioral options: `curve`, `reducedMotion`, `transitionDuration`.
 * @returns D3 selection of the `<path>` elements after the data join.
 *
 * @example
 * ```ts
 * renderLine(boundsGroup, series, xScale, yScale, d => d.x, { curve: 'monotoneX' });
 * ```
 */
export const renderLine = <T,>(
  boundsGroup: BoundsSelection,
  series: readonly ProcessedSeries<T>[],
  xScale: AnyScale,
  yScale: AnyScale,
  xAccessor: (d: T) => unknown,
  {
    curve = "linear",
    reducedMotion: reducedMotionOption,
    transitionDuration = 1000,
  }: RenderLineOptions = {},
): Selection<SVGPathElement, ProcessedSeries<T>, SVGGElement, null> => {
  const curveFactory = resolveCurve(curve);

  /** Build a path `d` attribute for a series using the configured curve factory. */
  const buildPath = (serie: ProcessedSeries<T>): null | string =>
    line<T>()
      .curve(curveFactory)
      .x((d) => asScaleNumber(xScale)(xAccessor(d)))
      .y((d) => asScaleNumber(yScale)(serie.accessor(d)))(
      serie.data,
    );

  const shouldReduceMotion: boolean =
    reducedMotionOption ??
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return boundsGroup
    .selectAll<SVGPathElement, ProcessedSeries<T>>("path.chart-line")
    .data(series, ({ label }) => label)
    .join(
      (enter) =>
        enter
          .append("path")
          .attr("class", ({ label }) => `chart-line chart-line--${label}`)
          .attr("fill", "none")
          .attr(
            "stroke",
            ({ stroke }) => stroke ?? "var(--vl-palette-0, steelblue)",
          )
          .attr("stroke-width", (d) => d.strokeWidth ?? "var(--vl-line-stroke-width, 2)")
          .attr("opacity", (d) => d.opacity ?? "var(--vl-line-opacity, 1)")
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("d", buildPath)
          .each(function () {
            if (shouldReduceMotion) return;
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
            .attr("opacity", d.opacity ?? "var(--vl-line-opacity, 1)")
            .transition()
            .duration(shouldReduceMotion ? 0 : transitionDuration)
            .attr("stroke-dashoffset", 0);
        }),
      (exit) => exit.remove(),
    );
};
