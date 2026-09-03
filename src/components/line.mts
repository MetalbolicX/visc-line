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
): Selection<SVGPathElement, { readonly i: number; readonly s: ProcessedSeries<T>; }, SVGGElement, unknown> => {
  const curveFactory = resolveCurve(curve);

  /** Build a path `d` attribute for a series using the configured curve factory. */
  const buildPath = (serie: ProcessedSeries<T>): null | string =>
    line<T>()
      .curve(curveFactory)
      .x((d) => asScaleNumber(xScale)(xAccessor(d)))
      .y((d) => asScaleNumber(yScale)(serie.accessor(d)))(
      serie.data,
    );

  // eslint-disable-next-line @typescript-eslint/naming-convention -- accessibility preference flag
  const shouldReduceMotion: boolean =
    reducedMotionOption ??
    (typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  // Index-preserving data join so palette index is stable across re-renders.
  const indexedSeries = series.map((s, i) => ({ i, s }));
  return boundsGroup
    .selectAll<SVGPathElement, (typeof indexedSeries)[number]>("path.chart-line")
    .data(indexedSeries, ({ s: { label } }) => label)
    .join(
      (enter) =>
        enter
          .append("path")
          .attr("class", ({ s: { label } }) => `chart-line chart-line--${label}`)
          .attr("fill", "none")
          .attr(
            "stroke",
            ({ i, s }) => s.stroke ?? `var(--vl-palette-${i}, steelblue)`,
          )
          .attr("stroke-width", ({ s }) => s.strokeWidth ?? "var(--vl-line-stroke-width, 2)")
          .attr("opacity", ({ s }) => s.opacity ?? "var(--vl-line-opacity, 1)")
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("d", ({ s }) => buildPath(s))
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
        update.each(function (datum) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { i, s } = datum as any;
          const path = select(this);
          const newPathD = buildPath(s);
          // Set the new path data FIRST so getTotalLength() reflects the
          // updated geometry. Using the stale length caused the dash pattern
          // to be too short when the new path is longer, clipping the line.
          path.attr("d", newPathD);
          const totalLength = this.getTotalLength();
          path
            .attr("stroke-dasharray", totalLength)
            .attr("stroke-dashoffset", totalLength)
            .attr("stroke", s.stroke ?? `var(--vl-palette-${i}, steelblue)`)
            .attr("opacity", s.opacity ?? "var(--vl-line-opacity, 1)")
            .transition()
            .duration(shouldReduceMotion ? 0 : transitionDuration)
            .attr("stroke-dashoffset", 0);
        }),
      (exit) => exit.remove(),
    );
};
