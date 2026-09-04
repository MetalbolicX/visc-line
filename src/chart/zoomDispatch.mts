/**
 * Zoom dispatch — registry-iterating callback factory.
 *
 * Extracts the `for (const feature of FEATURE_REGISTRY)` loop from
 * zoomPanDef.render into a dedicated, testable module. The callback
 * returned by createZoomRedrawCallback is passed to addZoomPan as the
 * onZoom handler.
 *
 * @module zoomDispatch
 * @internal
 */

import type { FeatureRenderContext } from "@/chart/featureContext.mjs";
import type { AnyScale } from "@/types/index.mjs";
import type { Dimensions } from "@/types/layoutTypes.mjs";

import { FEATURE_REGISTRY } from "@/chart/featureRegistry.mjs";
import { redrawLine } from "@/chart/redrawLine.mjs";

/**
 * Factory: builds the zoom callback that dispatches to registry participants.
 *
 * @param ctx - Feature render context (passed at render time; scales are
 *   provided by the zoom event at call time)
 * @param dims - Layout dimensions (fixed for the chart lifetime)
 * @returns A zoom callback suitable for passing to addZoomPan
 */
export const createZoomRedrawCallback = (
  ctx: FeatureRenderContext<unknown>,
  dims: Dimensions,
): ((newX: AnyScale, newY: AnyScale) => void) =>
(newX: AnyScale, newY: AnyScale): void => {
  // Registry-driven zoom dispatch — only features with onZoomRedraw participate
  for (const feature of FEATURE_REGISTRY) {
    if (ctx.flags[feature.flagKey] && feature.onZoomRedraw) {
      feature.onZoomRedraw(
        { ...ctx, allSeriesExtents: ctx.allSeriesExtents } as FeatureRenderContext<unknown>,
        dims,
        newX,
        newY,
      );
    }
  }
  // Line re-render — NOT in the registry; always redraws on zoom
  redrawLine(ctx, newX, newY);
};
