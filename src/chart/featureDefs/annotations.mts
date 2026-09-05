/**
 * Annotations feature definition.
 *
 * - Options: WithAnnotationsOptions { annotations: readonly ChartAnnotation[] }
 * - Comparator: areAnnotationsOptionsEqual
 * - Zoom-path: participates (re-renders on zoom)
 * - DOM cleanup: g.annotation
 *
 * @module featureDefs/annotations
 * @internal
 */

import type { WithAnnotationsOptions } from "@/chart/chartTypes.mjs";
import type { FeatureDefinition } from "@/chart/featureContext.mjs";
import type { AnyScale } from "@/types/index.mjs";

import { areAnnotationsOptionsEqual } from "@/chart/featureComparators.mjs";
import { renderAnnotations } from "@/components/annotations.mjs";

// ─── File-local helpers ───────────────────────────────────────────────────────

const renderAnnotationsScaled = (
  content: import("@/types/index.mjs").BoundsSelection,
  xScale: AnyScale,
  yScale: AnyScale,
  options: WithAnnotationsOptions,
): void => {
  renderAnnotations(content, {
    annotations: options.annotations,
    xScale,
    yScale,
  });
};

// ─── Feature definition ───────────────────────────────────────────────────────

export const annotationsDef: FeatureDefinition<"annotations"> = {
  clearSelectors: ["g.annotation"],
  flagKey: "hasAnnotations",
  isEqual: areAnnotationsOptionsEqual,
  key: "annotations",
  onZoomRedraw: (ctx, _dims, newX, newY) => {
    if (!ctx.flags.hasAnnotations) return;
    renderAnnotationsScaled(
      ctx.content,
      newX,
      newY,
      ctx.state.annotationsOptions as WithAnnotationsOptions,
    );
  },

  optionsKey: "annotationsOptions",

  render: (ctx, _dims) => {
    if (!ctx.flags.hasAnnotations) return;
    renderAnnotationsScaled(
      ctx.content,
      ctx.xScale,
      ctx.yScale,
      ctx.state.annotationsOptions as WithAnnotationsOptions,
    );
  },
};
