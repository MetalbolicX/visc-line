import type { ZoomBehavior, ZoomTransform } from "d3";

import { zoom, zoomIdentity } from "d3";

import type { AnyScale, SVGSelection } from "@/types/index.mjs";

/** The D3 zoom behavior augmented with a `reset()` helper. */
export type ZoomBehaviorWithReset = Readonly<{
  readonly reset: () => void;
}> & ZoomBehavior<SVGSVGElement, unknown>;

/** Options for {@link addZoomPan}. */
interface AddZoomPanOptions {
  readonly innerHeight: number;
  readonly innerWidth: number;
  readonly margins: { readonly left: number; readonly top: number; readonly right: number; readonly bottom: number };
  readonly onZoom: (newX: AnyScale, newY: AnyScale) => void;
  readonly xScale: AnyScale;
  readonly yScale: AnyScale;
  /** Minimum and maximum zoom levels (default: [0.5, 32]). */
  readonly scaleExtent?: readonly [number, number];
}

/**
 * Attach pan and zoom behavior to an SVG selection using D3's zoom.
 *
 * The function creates a zoom behavior with a fixed scale extent and extent
 * based on the provided inner dimensions. On every zoom event it calls the
 * provided `onZoom` callback with the rescaled x and y scales.
 *
 * The returned zoom behavior is augmented with a `reset()` helper that resets
 * the applied transform on the SVG.
 *
 * @param svg - The SVG selection to attach the zoom to.
 * @param options - Configuration options.
 * @returns The configured D3 zoom behavior augmented with a `reset()` method.
 */
export const addZoomPan = (
  svg: SVGSelection,
  { innerHeight, innerWidth, margins, onZoom, scaleExtent = [0.5, 32], xScale, yScale }: AddZoomPanOptions,
): ZoomBehaviorWithReset => {
  const zoomBehavior = zoom<SVGSVGElement, unknown>()
    .scaleExtent([scaleExtent[0], scaleExtent[1]])
    .extent([
      [margins.left, margins.top],
      [margins.left + innerWidth, margins.top + innerHeight],
    ])
    .on("zoom", (event) => {
      const { transform: t } = event as Readonly<{ readonly transform: { readonly rescaleX: (scale: unknown) => unknown; readonly rescaleY: (scale: unknown) => unknown } }>;
      onZoom(
        t.rescaleX(xScale) as AnyScale,
        t.rescaleY(yScale) as AnyScale,
      );
    });

  svg.call(zoomBehavior as never);

  const augmented = zoomBehavior as unknown as ZoomBehaviorWithReset;

  Object.defineProperty(augmented, "reset", {
    configurable: true,
    value: () =>
      svg.call(
        // eslint-disable-next-line @typescript-eslint/unbound-method
        zoomBehavior.transform as never,
        zoomIdentity as unknown as ZoomTransform,
      ),
  });

  return augmented;
};
