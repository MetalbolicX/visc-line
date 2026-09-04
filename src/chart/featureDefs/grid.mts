/**
 * Grid feature definition.
 *
 * - Options: WithGridOptions { showX?, showY? }
 * - Comparator: areGridOptionsEqual
 * - Zoom-path: participates (re-renders on zoom)
 * - DOM cleanup: line.grid-x, line.grid-y
 *
 * @module featureDefs/grid
 * @internal
 */

import type { WithGridOptions } from "@/chart/chartTypes.mjs";
import type { FeatureDefinition } from "@/chart/featureContext.mjs";
import type { AnyScale } from "@/types/index.mjs";

import { areGridOptionsEqual } from "@/chart/featureComparators.mjs";
import { renderXGrid, renderYGrid } from "@/components/grid.mjs";

// ─── File-local helpers ───────────────────────────────────────────────────────

const renderGridScales = (
  content: import("@/types/index.mjs").BoundsSelection,
  xScale: AnyScale,
  yScale: AnyScale,
  gridOptions: WithGridOptions,
): void => {
  // eslint-disable-next-line @typescript-eslint/naming-convention -- showX/showY match public API types
  const { showX = true, showY = true } = gridOptions;
  if (showX) { content.call(renderXGrid, xScale, yScale); }
  else { content.selectAll("line.grid-x").remove(); }
  if (showY) { content.call(renderYGrid, xScale, yScale); }
  else { content.selectAll("line.grid-y").remove(); }
};

// ─── Feature definition ───────────────────────────────────────────────────────

export const gridDef: FeatureDefinition<"grid"> = {
  clearSelectors: ["line.grid-x", "line.grid-y"],
  flagKey: "hasGrid",
  isEqual: areGridOptionsEqual,
  key: "grid",
  onZoomRedraw: (ctx, _dims, newX, newY) => {
    if (!ctx.flags.hasGrid) return;
    renderGridScales(ctx.content, newX, newY, ctx.state.gridOptions as WithGridOptions);
  },

  optionsKey: "gridOptions",

  render: (ctx, _dims) => {
    if (!ctx.flags.hasGrid) return;
    renderGridScales(ctx.content, ctx.xScale, ctx.yScale, ctx.state.gridOptions as WithGridOptions);
  },
};
