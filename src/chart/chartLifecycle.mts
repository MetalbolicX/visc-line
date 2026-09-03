import type { FeatureFlags } from "@/chart/chartState.mjs";
import type { BoundsSelection, SVGSelection } from "@/types/index.mjs";

import { FEATURE_REGISTRY } from "@/chart/featureRegistry.mjs";

/**
 * Clear optional chart elements based on the active feature flags.
 *
 * This function removes DOM nodes and event handlers for optional
 * chart features (axes, grid, points, title, legend, tooltip, zoom/pan)
 * when the corresponding flags indicate the feature is disabled.
 *
 * Note: side effects include DOM mutations on the provided `bounds`
 * and `svg` selections and an invocation of `onZoomPanCleared()` when
 * zoom/pan handlers are removed.
 *
 * @internal
 * @param bounds - D3 selection scoped to the chart bounds where axes, grid and tooltip
 *                 elements live. Must accept `.selectAll(...)` and `.on(...)` calls.
 * @param svg - D3 root SVG selection for chart-level elements (title, legend, zoom).
 * @param flags - Feature flags that control which optional elements should remain.
 *                Individual properties such as `hasAxes`, `hasGrid`, `hasTooltip`,
 *                and `hasZoomPan` toggle removal of their corresponding nodes/handlers.
 * @param onZoomPanCleared - Callback invoked after zoom/pan handlers are removed; used
 *                           to clear any external zoom-related state.
 * @returns void
 */
export const clearOptionalNodes = (
  bounds: BoundsSelection,
  svg: SVGSelection,
  flags: FeatureFlags,
  onZoomPanCleared: () => void,
): void => {
  // Registry-driven cleanup for migrated features (axes, grid, points, title, legend, tooltip)
  for (const feature of FEATURE_REGISTRY) {
    if (!flags[feature.flagKey]) {
      for (const selector of feature.clearSelectors) {
        // Axes selectors split: text.* → svg, g.* / line.* → bounds
        if (selector.startsWith("text.") || selector.startsWith("g.legend") || selector.startsWith("g.tooltip")) {
          svg.selectAll(selector).remove();
        } else {
          bounds.selectAll(selector).remove();
        }
      }
      // Event listener cleanup — tooltip events are on bounds, zoom events on svg
      if (feature.clearEvents) {
        for (const event of feature.clearEvents) {
          if (event.includes("zoom")) {
            svg.on(event, null);
          } else {
            bounds.on(event, null);
          }
        }
      }
    }
  }

  if (!flags.hasAxes) {
    bounds.selectAll("g.x-axis, g.y-axis").remove();
    svg.selectAll("text.x-axis-label, text.y-axis-label").remove();
  }

  if (!flags.hasGrid) {
    bounds.selectAll("line.grid-x, line.grid-y").remove();
  }

  if (!flags.hasZoomPan) {
    svg.on(".zoom", null);
    onZoomPanCleared();
  }
};

/**
 * Remove all interactive/chart enhancement artifacts unconditionally.
 *
 * This performs a best-effort cleanup of tooltip elements and event handlers
 * as well as zoom handlers. It always invokes `onZoomPanCleared()` to allow
 * callers to reset any zoom-related external state.
 *
 * @param bounds - Selection containing tooltip cursor/dot elements and tooltip handlers.
 * @param svg - Root SVG selection where zoom handlers are attached.
 * @param onZoomPanCleared - Callback executed after zoom handlers are removed.
 */
export const cleanupAllEnhancements = (
  bounds: BoundsSelection,
  svg: SVGSelection,
  onZoomPanCleared: () => void,
): void => {
  bounds
    .on("mousemove.tooltip", null)
    .on("mouseleave.tooltip", null)
    .selectAll("line.tooltip-cursor, circle.tooltip-dot")
    .remove();

  svg.on(".zoom", null);
  onZoomPanCleared();
};
