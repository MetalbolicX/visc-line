/**
 * End-of-line direct labels feature definition.
 *
 * @module featureDefs/endLabels
 * @internal
 */

import type { FeatureDefinition } from "@/chart/featureContext.mjs";

import { areEndLabelsOptionsEqual } from "@/chart/featureComparators.mjs";
import { renderEndLabels } from "@/components/endLabels.mjs";

export const endLabelsDef: FeatureDefinition<"endLabels"> = {
  clearSelectors: ["text.end-label"],
  flagKey: "hasEndLabels",
  isEqual: areEndLabelsOptionsEqual,
  key: "endLabels",
  onZoomRedraw: (ctx, _dims, newX, newY) => {
    if (!ctx.flags.hasEndLabels) return;
    if (!ctx.state.endLabelsOptions) return;
    renderEndLabels(ctx.content, ctx.state.currentSeries, newX, newY, ctx.config.xSerie.accessor, { ...ctx.state.endLabelsOptions, focusLabels: ctx.state.focusLabels });
  },
  optionsKey: "endLabelsOptions",
  render: (ctx, _dims) => {
    if (!ctx.flags.hasEndLabels) return;
    if (!ctx.state.endLabelsOptions) return;
    renderEndLabels(ctx.content, ctx.state.currentSeries, ctx.xScale, ctx.yScale, ctx.config.xSerie.accessor, { ...ctx.state.endLabelsOptions, focusLabels: ctx.state.focusLabels });
  },
};
