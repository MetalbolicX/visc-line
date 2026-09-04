/**
 * Custom callback feature definition — arbitrary user-rendered content.
 *
 * - Options: CustomCallback function
 * - Comparator: () => true (no options to compare; callback identity checked elsewhere)
 * - Zoom-path: excluded (custom does not re-render on zoom)
 * - DOM cleanup: none (custom manages its own DOM)
 *
 * @module featureDefs/custom
 * @internal
 */

import type { FeatureDefinition } from "@/chart/featureContext.mjs";

export const customDef: FeatureDefinition<"custom"> = {
  clearSelectors: [],
  flagKey: "hasCustom",
  isEqual: () => true,
  key: "custom",
  optionsKey: "customCallback",
  render: (ctx, dims) => {
    if (!ctx.state.customCallback || !ctx.flags.hasCustom) return;
    const customCtx = {
      bounds: ctx.bounds,
      content: ctx.content,
      dims,
      svg: ctx.svg,
      xScale: ctx.xScale,
      yScale: ctx.yScale,
    };
    ctx.state.customCleanup?.();
    const cleanup = ctx.state.customCallback(customCtx);
    ctx.callbacks.onCustomCleanupChange(typeof cleanup === "function" ? cleanup : null);
  },
};
