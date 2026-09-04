/**
 * Points feature definition — data point circles overlay.
 *
 * - Options: none (hasPoints is a boolean flag, not an options object)
 * - Comparator: () => true (no options to compare)
 * - Zoom-path: participates (re-renders on zoom)
 * - DOM cleanup: g.point-series
 *
 * @module featureDefs/points
 * @internal
 */

import type { FeatureDefinition } from "@/chart/featureContext.mjs";
import type { AnyScale } from "@/types/index.mjs";

import { renderPoints } from "@/components/points.mjs";

// ─── File-local helpers ───────────────────────────────────────────────────────

const renderPointsAt = (
  ctx: FeatureRenderContext<unknown>,
  xScale: AnyScale,
  yScale: AnyScale,
): void => {
  renderPoints(ctx.content, ctx.state.currentSeries, xScale, yScale, ctx.config.xSerie.accessor);
};

// ─── Feature definition ───────────────────────────────────────────────────────

import type { FeatureRenderContext } from "@/chart/featureContext.mjs";

export const pointsDef: FeatureDefinition<"points"> = {
  clearSelectors: ["g.point-series"],
  flagKey: "hasPoints",
  isEqual: () => true,
  key: "points",
  onZoomRedraw: (ctx, _dims, newX, newY) => {
    if (!ctx.flags.hasPoints) return;
    renderPointsAt(ctx, newX, newY);
  },

  optionsKey: "hasPoints",

  render: (ctx) => {
    if (!ctx.flags.hasPoints) return;
    renderPointsAt(ctx, ctx.xScale, ctx.yScale);
  },
};
