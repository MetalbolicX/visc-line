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
  renderLine<T>(
    ctx.content as import("@/types/index.mjs").BoundsSelection,
    ctx.state.currentSeries as import("@/types/index.mjs").ProcessedSeries<T>[],
    xScale,
    yScale,
    ctx.config.xSerie.accessor,
    { curve: ctx.resolvedCurve, reducedMotion: ctx.reducedMotion },
  );
};
