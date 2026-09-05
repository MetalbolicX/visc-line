import type { CurveFactory } from "d3";

import type { ChartState, FeatureFlags } from "@/chart/chartState.mjs";
import type { FeatureRenderContext } from "@/chart/featureRegistry.mjs";
import type { ZoomBehaviorWithReset } from "@/interactivity/index.mjs";
import type {
  BoundsSelection,
  ChartConfig,
  ScaleType,
  SVGSelection,
} from "@/types/index.mjs";
import type { Margins } from "@/types/index.mjs";

import { clearOptionalNodes } from "@/chart/chartLifecycle.mjs";
import { FEATURE_REGISTRY } from "@/chart/featureRegistry.mjs";
import { redrawLine } from "@/chart/redrawLine.mjs";
import { renderContentGroup } from "@/components/contentGroup.mjs";
import {
  createScales,
  getDimensions,
  getMultiSeriesExtents,
} from "@/services/index.mjs";

/**
 * Callbacks invoked by the renderer to notify the host about lifecycle events.
 *
 * Currently only used to communicate the active zoom behavior so the owner can
 * keep a reference (e.g. to reset or dispose it) when re-rendering or tearing
 * down the chart.
 *
 * @internal
 */
export interface RenderCallbacks {
  /**
   * Invoked whenever the custom cleanup function changes.
   * @param {(() => void) | null} cleanup - New cleanup function, or null to clear.
   */
  readonly onCustomCleanupChange: (cleanup: (() => void) | null) => void;
  /**
   * Invoked whenever the renderer creates or clears the zoom behavior.
   * @param {ZoomBehaviorWithReset | null} zoomBehavior - Newly active zoom
   *   behavior, or null when the renderer removed any zoom handlers.
   */
  readonly onZoomBehaviorChange: (
    zoomBehavior: null | ZoomBehaviorWithReset,
  ) => void;
}

/**
 * Context required to render a chart instance.
 *
 * Provides all inputs and handles needed by the rendering pipeline: DOM
 * attachment points (svg, bounds, container), visual configuration, runtime
 * state and feature flags. Implementations should treat this object as
 * read-only; rendering mutates the DOM but does not change the context.
 *
 * @template T - data series point type used by the chart (matches ChartConfig<T>)
 * @internal
 * @property {BoundsSelection} bounds - Group selection used as the drawing
 *   origin for axes/content (already translated by margins).
 * @property {ChartConfig<T>} config - Static chart configuration (series
 *   definitions, labels, accessors).
 * @property {HTMLElement} container - Outer container element used to compute
 *   layout (width/height) and attach the SVG.
 * @property {ChartState<T>} state - Mutable runtime state (currentSeries,
 *   tooltip/title/legend/zoom options, isDisposed flag). The renderer will read
 *   from this but will not mutate state directly.
 * @property {FeatureFlags} flags - Feature toggles controlling which
 *   components (axes, grid, points, legend, tooltip, zoom/pan, title) are
 *   rendered.
 * @property {Margins} margins - Resolved margins applied to layout calculations.
 * @property {CurveFactory} resolvedCurve - D3 curve factory used when drawing lines.
 * @property {SVGSelection} svg - Root SVG selection for attaching top-level
 *   elements (title, legend, axis labels) and global event handlers.
 * @property {ScaleType} xType - Type of the X scale (used when creating scales).
 * @property {boolean} reducedMotion - When true, animations/transitions should be minimized.
 */
export interface RenderContext<T> {
  readonly bounds: BoundsSelection;
  readonly clipPathId: string;
  readonly config: ChartConfig<T>;
  readonly container: HTMLElement;
  readonly flags: FeatureFlags;
  readonly margins: Margins;
  readonly reducedMotion: boolean;
  readonly resolvedCurve: CurveFactory;
  readonly state: ChartState<T>;
  readonly svg: SVGSelection;
  readonly xLabel?: string;
  readonly xType: ScaleType;
  readonly yLabel?: string;
}

/**
 * Render the entire chart for a given context.
 *
 * This function drives the rendering pipeline: it computes layout, creates
 * scales, draws lines/points, optionally renders axes, grid, title and legend,
 * and wires up interactivity such as tooltip and zoom/pan.
 *
 * Side effects:
 * - Mutates the provided SVG/bounds DOM by appending/updating elements.
 * - Attaches event listeners (zoom/pan); when creating a zoom behavior the
 *   renderer will call `callbacks.onZoomBehaviorChange` with the new behavior.
 * - When clearing the chart the renderer will call `callbacks.onZoomBehaviorChange(null)`.
 *
 * The function returns early if `context.state.isDisposed` is true.
 *
 * @template T - type of points in the series data
 * @param {RenderContext<T>} context - Rendering inputs and runtime state
 * @param {RenderCallbacks} callbacks - Lifecycle callbacks the renderer will call
 * @returns {void}
 * @example
 * ```ts
 * // Typical usage: called from a chart manager after state/config changes
 * renderChart(context, { onZoomBehaviorChange: (z) => (zoomRef = z) });
 * ```
 */
export const renderChart = <T,>(
  context: RenderContext<T>,
  callbacks: RenderCallbacks,
): void => {
  if (context.state.isDisposed) return;

  const dims = getDimensions(context.container, context.margins);

  const content = renderContentGroup(context.bounds, context.svg, {
    clipPathId: context.clipPathId,
    innerHeight: dims.innerHeight,
    innerWidth: dims.innerWidth,
  });

  const { xDomain, yDomain } = getMultiSeriesExtents(
    context.state.currentSeries,
    context.config.xSerie.accessor,
  );

  const [visibleXMin, visibleXMax] = xDomain;
  const [visibleYMin, visibleYMax] = yDomain;
  const xDomainToUse =
    visibleXMin !== undefined && visibleXMax !== undefined
      ? xDomain
      : context.state.allSeriesExtents.xDomain;
  // eslint-disable-next-line @typescript-eslint/naming-convention -- local variable named for clarity
  const singleSeriesVisible = context.state.currentSeries.length === 1;
  const yDomainToUse = singleSeriesVisible &&
    visibleYMin !== undefined &&
    visibleYMax !== undefined
    ? yDomain
    : context.state.allSeriesExtents.yDomain;

  const { xScale, yScale } = createScales({
    innerHeight: dims.innerHeight,
    innerWidth: dims.innerWidth,
    xDomain: xDomainToUse as Parameters<typeof createScales>[0]["xDomain"],
    xType: context.xType,
    yDomain: yDomainToUse,
  });

  redrawLine<T>(
    { ...context, allSeriesExtents: { xDomain: xDomainToUse as readonly [unknown, unknown], yDomain: yDomainToUse as readonly [number, number] }, callbacks, content, xScale, yScale } as FeatureRenderContext<T>,
    xScale,
    yScale,
  );

  // Registry-driven feature render loop
  for (const feature of FEATURE_REGISTRY) {
    if (context.flags[feature.flagKey]) {
      feature.render(
        { ...context, allSeriesExtents: { xDomain: xDomainToUse as readonly [unknown, unknown], yDomain: yDomainToUse as readonly [number, number] }, callbacks, content, xScale, yScale } as FeatureRenderContext<unknown>,
        dims,
      );
    }
  }

  clearOptionalNodes(context.bounds, context.svg, context.flags);
};
