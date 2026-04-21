import type { ZoomBehavior, ZoomScale } from "d3";

import { zoom } from "d3";

import type { AnyScale, SVGSelection } from "@/types/index.mjs";

/** The D3 zoom behavior augmented with a `reset()` helper. */
export type ZoomBehaviorWithReset = ZoomBehavior<SVGSVGElement, unknown> & {
  reset: () => void;
};

/** Options for {@link addZoomPan}. */
interface AddZoomPanOptions {
  innerHeight: number;
  innerWidth: number;
  onZoom: (newX: AnyScale, newY: AnyScale) => void;
  xScale: AnyScale;
  yScale: AnyScale;
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
export /**
        *
        */
const addZoomPan = (
  svg: SVGSelection,
  { innerHeight, innerWidth, onZoom, xScale, yScale }: AddZoomPanOptions,
): ZoomBehaviorWithReset => {
  /**
   *
   */
  const zoomBehavior = zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.5, 32])
    .extent([
      [0, 0],
      [innerWidth, innerHeight],
    ])
    .on("zoom", (event) => {
      /**
       *
       */
      const { transform: t } = event;
      onZoom(
        t.rescaleX(xScale as ZoomScale) as AnyScale,
        t.rescaleY(yScale as ZoomScale) as AnyScale,
      );
    });

  svg.call(zoomBehavior as never);

  /**
   *
   */
  const augmented = zoomBehavior as ZoomBehaviorWithReset;
  /**
   *
   */
  augmented.reset = () =>
    svg.call(
      zoomBehavior.transform as never,
      zoom<SVGSVGElement, unknown>().transform,
    );

  return augmented;
};
