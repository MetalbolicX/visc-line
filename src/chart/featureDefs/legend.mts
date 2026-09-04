/**
 * Legend feature definition.
 *
 * - Options: WithLegendOptions { interactive?, items?, onToggle? }
 * - Comparator: areLegendOptionsEqual
 * - Zoom-path: excluded (legend does not re-render on zoom)
 * - DOM cleanup: g.legend
 *
 * @module featureDefs/legend
 * @internal
 */

import type { FeatureDefinition } from "@/chart/featureContext.mjs";

import { LEGEND_TOP_OFFSET, LEGEND_WIDTH } from "@/chart/chartConstants.mjs";
import { areLegendOptionsEqual } from "@/chart/featureComparators.mjs";
import { renderLegend } from "@/components/legend.mjs";

export const legendDef: FeatureDefinition<"legend"> = {
  clearSelectors: ["g.legend"],
  flagKey: "hasLegend",
  isEqual: areLegendOptionsEqual,
  key: "legend",
  optionsKey: "legendOptions",
  render: (ctx, dims) => {
    if (!ctx.flags.hasLegend || !ctx.state.legendOptions) return;
    const derivedItems = ctx.state.allSeries.map((s, i) => ({
      color: s.stroke ?? `var(--vl-palette-${String(i)}, steelblue)`,
      label: s.label,
    }));
    ctx.svg.call(renderLegend, {
      interactive: ctx.state.legendOptions.interactive,
      items: ctx.state.legendOptions.items ?? derivedItems,
      onToggle: ctx.state.legendOptions.onToggle,
      visibleLabels: ctx.state.visibleLabels,
      x: ctx.margins.left + dims.innerWidth - LEGEND_WIDTH,
      y: ctx.margins.top + LEGEND_TOP_OFFSET,
    });
  },
};
