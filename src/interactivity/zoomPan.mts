import { zoom } from "d3";
import type { ZoomBehavior } from "d3";
import type { SVGSelection, AnyScale } from "@/types/index.mjs";

/** Options for {@link addZoomPan}. */
interface AddZoomPanOptions {
  xScale: AnyScale;
  yScale: AnyScale;
  innerWidth: number;
  innerHeight: number;
  onZoom: (newX: AnyScale, newY: AnyScale) => void;
}

/** The D3 zoom behavior augmented with a `reset()` helper. */
export type ZoomBehaviorWithReset = ZoomBehavior<SVGSVGElement, unknown> & {
  reset: () => void;
};

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
  { xScale, yScale, innerWidth, innerHeight, onZoom }: AddZoomPanOptions,
): ZoomBehaviorWithReset => {
  const zoomBehavior = zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.5, 32])
    .extent([
      [0, 0],
      [innerWidth, innerHeight],
    ])
    .on("zoom", (event) => {
      const { transform: t } = event;
      onZoom(
        t.rescaleX(xScale as never) as unknown as AnyScale,
        t.rescaleY(yScale as never) as unknown as AnyScale,
      );
    });

  svg.call(zoomBehavior as never);

  const augmented = zoomBehavior as ZoomBehaviorWithReset;
  augmented.reset = () =>
    svg.call(
      zoomBehavior.transform as never,
      zoom<SVGSVGElement, unknown>().transform,
    );

  return augmented;
};
