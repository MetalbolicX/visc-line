/**
 * Shared line redraw helper.
 *
 * Used by both the initial render path (chartRender.mts) and the zoom
 * dispatch callback. Consolidates the two call sites so renderLine is
 * called in exactly one place.
 *
 * @module redrawLine
 * @internal
 */

import type { FeatureRenderContext } from "@/chart/featureContext.mjs";
import type { AnyScale } from "@/types/index.mjs";

import { renderLine } from "@/components/line.mjs";

type RedrawLine = <T>(
  ctx: FeatureRenderContext<T>,
  xScale: AnyScale,
  yScale: AnyScale,
) => void;

/**
 * Re-render the chart line for the current series.
 *
 * @param ctx - Feature render context (provides series, scales, config)
 * @param xScale - X scale to use (may differ from ctx.xScale during zoom)
 * @param yScale - Y scale to use (may differ from ctx.yScale during zoom)
 */
export const redrawLine: RedrawLine = <T,>(
  ctx: FeatureRenderContext<T>,
  xScale: AnyScale,
  yScale: AnyScale,
): void => {
  // Use ctx.lineSeries if provided (gapPolicy="break" path), otherwise fall back
  // to ctx.state.currentSeries (gapPolicy="bridge" path).
  // ctx.lineSeries is x-only filtered to preserve NaN-y rows for .defined() to break.
  // ctx.state.currentSeries stays y-filtered for points/extents/tooltip.
  const series = ctx.lineSeries ?? ctx.state.currentSeries;

  renderLine<T>(
    ctx.content as import("@/types/index.mjs").BoundsSelection,
    series as import("@/types/index.mjs").ProcessedSeries<T>[],
    xScale,
    yScale,
    ctx.config.xSerie.accessor,
    { curve: ctx.resolvedCurve, defined: ctx.defined, reducedMotion: ctx.reducedMotion },
  );
};
