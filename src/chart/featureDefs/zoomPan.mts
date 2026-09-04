/**
 * Zoom/Pan feature definition — the zoom dispatch trigger.
 *
 * - Options: WithZoomPanOptions { onZoom?, scaleExtent? }
 * - Comparator: areZoomPanOptionsEqual
 * - Zoom-path: zoomPan IS the trigger; no onZoomRedraw of its own
 * - DOM cleanup: no selectors; event cleanup via svg.on(".zoom", null)
 *
 * @module featureDefs/zoomPan
 * @internal
 */

import type { FeatureDefinition } from "@/chart/featureContext.mjs";

import { areZoomPanOptionsEqual } from "@/chart/featureComparators.mjs";
import { createZoomRedrawCallback } from "@/chart/zoomDispatch.mjs";
import { addZoomPan } from "@/interactivity/zoomPan.mjs";

export const zoomPanDef: FeatureDefinition<"zoomPan"> = {
  clearEvents: [".zoom"],
  clearSelectors: [],
  flagKey: "hasZoomPan",
  isEqual: areZoomPanOptionsEqual,
  key: "zoomPan",
  optionsKey: "zoomPanOptions",
  render: (ctx, dims) => {
    if (!ctx.flags.hasZoomPan) return;
    ctx.svg.on(".zoom", null);
    const zoomBehavior = addZoomPan(ctx.svg, {
      innerHeight: dims.innerHeight,
      innerWidth: dims.innerWidth,
      margins: ctx.margins,
      onZoom:
        ctx.state.zoomPanOptions.onZoom ??
        createZoomRedrawCallback(ctx, dims),
      scaleExtent: ctx.state.zoomPanOptions.scaleExtent,
      xScale: ctx.xScale,
      yScale: ctx.yScale,
    });
    ctx.callbacks.onZoomBehaviorChange(zoomBehavior);
  },
};
