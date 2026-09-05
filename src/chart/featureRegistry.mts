/**
 * Feature registry — central declaration of all optional chart features.
 *
 * Each feature is declared once with its flag, options, comparator, render
 * behavior, zoom-path participation, and DOM cleanup selectors. The registry
 * drives `with*` method generation, `getFeatureFlags`, `clearOptionalNodes`,
 * and the render/zoom dispatch loops.
 *
 * @module featureRegistry
 * @internal
 */

// ─── Re-export shared types for internal consumers ────────────────────────────

export type {
  FeatureDefinition,
  FeatureKey,
  FeatureOptionsMap,
  FeatureRenderContext,
} from "@/chart/featureContext.mjs";
export type { RenderCallbacks } from "@/chart/featureContext.mjs";
export type { Dimensions } from "@/types/layoutTypes.mjs";

// ─── Per-feature defs (imported from featureDefs/ for composition) ────────────

import type { FeatureDefinition } from "@/chart/featureContext.mjs";

import { axesDef } from "@/chart/featureDefs/axes.mjs";
import { customDef } from "@/chart/featureDefs/custom.mjs";
import { endLabelsDef } from "@/chart/featureDefs/endLabels.mjs";
import { gridDef } from "@/chart/featureDefs/grid.mjs";
import { legendDef } from "@/chart/featureDefs/legend.mjs";
import { pointsDef } from "@/chart/featureDefs/points.mjs";
import { titleDef } from "@/chart/featureDefs/title.mjs";
import { tooltipDef } from "@/chart/featureDefs/tooltip.mjs";
import { zoomPanDef } from "@/chart/featureDefs/zoomPan.mjs";

// ─── Registry ─────────────────────────────────────────────────────────────────

/** Ordered registry — the array order IS the render sequence */
export const FEATURE_REGISTRY: readonly FeatureDefinition<"axes" | "custom" | "endLabels" | "grid" | "legend" | "points" | "title" | "tooltip" | "zoomPan">[] = [
  axesDef,
  gridDef,
  titleDef,
  legendDef,
  tooltipDef,
  zoomPanDef,
  customDef,
  endLabelsDef,
  pointsDef,
];
