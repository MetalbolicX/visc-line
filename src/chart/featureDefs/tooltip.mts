/**
 * Tooltip feature definition.
 *
 * - Options: WithTooltipOptions { formatX?, formatY?, stylesheetUrl?, tooltipHtml? }
 * - Comparator: areTooltipOptionsEqual
 * - Zoom-path: excluded (tooltip does not re-render on zoom)
 * - DOM cleanup: line.tooltip-cursor, circle.tooltip-dot;
 *   event listeners: mousemove.tooltip, mouseleave.tooltip
 *
 * @module featureDefs/tooltip
 * @internal
 */

import type { FeatureDefinition } from "@/chart/featureContext.mjs";

import { areTooltipOptionsEqual } from "@/chart/featureComparators.mjs";
import { addTooltip } from "@/interactivity/tooltip.mjs";

export const tooltipDef: FeatureDefinition<"tooltip"> = {
  clearEvents: ["mousemove.tooltip", "mouseleave.tooltip"],
  clearSelectors: ["line.tooltip-cursor", "circle.tooltip-dot"],
  flagKey: "hasTooltip",
  isEqual: areTooltipOptionsEqual,
  key: "tooltip",
  optionsKey: "tooltipOptions",
  render: (ctx, dims) => {
    if (!ctx.flags.hasTooltip) return;
    // addTooltip is called directly (not via .call) since it needs the boundsGroup as first arg
    addTooltip<unknown>(
      ctx.bounds,
      ctx.state.currentSeries,
      ctx.xScale,
      ctx.yScale,
      ctx.config.xSerie.accessor,
      {
        ...ctx.state.tooltipOptions,
        innerHeight: dims.innerHeight,
        innerWidth: dims.innerWidth,
      },
    );
  },
};
