/**
 * Reference lines feature definition.
 *
 * - Options: WithReferenceLinesOptions { lines: readonly ReferenceLine[] }
 * - Comparator: areReferenceLinesOptionsEqual
 * - Zoom-path: participates (re-renders on zoom)
 * - DOM cleanup: g.reference-line
 *
 * @module featureDefs/referenceLines
 * @internal
 */

import type { WithReferenceLinesOptions } from "@/chart/chartTypes.mjs";
import type { FeatureDefinition } from "@/chart/featureContext.mjs";
import type { AnyScale } from "@/types/index.mjs";
import type { Dimensions } from "@/types/layoutTypes.mjs";

import { areReferenceLinesOptionsEqual } from "@/chart/featureComparators.mjs";
import { renderReferenceLines } from "@/components/referenceLines.mjs";

// ─── File-local helpers ───────────────────────────────────────────────────────

const renderReferenceLinesScaled = (
  content: import("@/types/index.mjs").BoundsSelection,
  xScale: AnyScale,
  yScale: AnyScale,
  dims: Dimensions,
  options: WithReferenceLinesOptions,
): void => {
  renderReferenceLines(content, {
    innerHeight: dims.innerHeight,
    innerWidth: dims.innerWidth,
    lines: options.lines,
    xScale,
    yScale,
  });
};

// ─── Feature definition ───────────────────────────────────────────────────────

export const referenceLinesDef: FeatureDefinition<"referenceLines"> = {
  clearSelectors: ["g.reference-line"],
  flagKey: "hasReferenceLines",
  isEqual: areReferenceLinesOptionsEqual,
  key: "referenceLines",
  onZoomRedraw: (ctx, dims, newX, newY) => {
    if (!ctx.flags.hasReferenceLines) return;
    renderReferenceLinesScaled(
      ctx.content,
      newX,
      newY,
      dims,
      ctx.state.referenceLinesOptions as WithReferenceLinesOptions,
    );
  },

  optionsKey: "referenceLinesOptions",

  render: (ctx, dims) => {
    if (!ctx.flags.hasReferenceLines) return;
    renderReferenceLinesScaled(
      ctx.content,
      ctx.xScale,
      ctx.yScale,
      dims,
      ctx.state.referenceLinesOptions as WithReferenceLinesOptions,
    );
  },
};
