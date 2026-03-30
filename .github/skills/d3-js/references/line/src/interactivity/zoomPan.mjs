"use strict";
import { zoom } from "d3";

/**
 * Attach pan and zoom behavior to an SVG selection using D3's zoom.
 *
 * The function creates a zoom behavior with a fixed scale extent and extent
 * based on the provided inner dimensions. On every zoom event it calls the
 * provided onZoom callback with the rescaled x and y scales.
 *
 * The returned zoom behavior is augmented with a `reset()` helper that resets
 * the applied transform on the SVG.
 *
 * @param {import('d3-selection').Selection<SVGSVGElement, any, any, any>} svg - The SVG selection to attach the zoom to.
 * @param {Object} options - Configuration options.
 * @param {import('d3-scale').ScaleContinuousNumeric<number, number>} options.xScale - X scale to be rescaled during zoom/pan.
 * @param {import('d3-scale').ScaleContinuousNumeric<number, number>} options.yScale - Y scale to be rescaled during zoom/pan.
 * @param {number} options.innerWidth - Inner drawing width used to set the zoom extent.
 * @param {number} options.innerHeight - Inner drawing height used to set the zoom extent.
 * @param {function(import('d3-scale').ScaleContinuousNumeric<number, number>, import('d3-scale').ScaleContinuousNumeric<number, number>): void} options.onZoom - Callback invoked on zoom events with the rescaled x and y scales.
 * @returns {import('d3-zoom').ZoomBehavior<Element, unknown> & { reset: () => void }} The configured D3 zoom behavior augmented with a `reset()` method.
 */
export const addZoomPan = (
  svg,
  { xScale, yScale, innerWidth, innerHeight, onZoom },
) => {
  const zoomBehavior = zoom()
    .scaleExtent([0.5, 32])
    .extent([
      [0, 0],
      [innerWidth, innerHeight],
    ])
    .on("zoom", (event) => {
      const { transform: t } = event;
      onZoom(t.rescaleX(xScale), t.rescaleY(yScale));
    });

  svg.call(zoomBehavior);

  // Expose a reset helper on the returned behavior
  zoomBehavior.reset = () => svg.call(zoomBehavior.transform, zoom().transform);

  return zoomBehavior;
};
