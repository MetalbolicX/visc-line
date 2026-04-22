import type { Dimensions, Margins } from "@/types/index.mjs";

/**
 * Compute layout dimensions for a DOM container element, accounting for margins.
 *
 * - Reads the container's bounding client rect and returns its raw width/height.
 * - Computes innerWidth/innerHeight by subtracting the provided margins and
 *   clamping the results to >= 0 to avoid negative drawable areas.
 * - Side effect: reads from the DOM via getBoundingClientRect(); avoid calling
 *   during server-side rendering.
 *
 * @param {Element} container - Measurable DOM element (must be attached to the document).
 * @param {Margins} margins - Object with numeric top/right/bottom/left margins to subtract.
 * @returns {Dimensions} Dimension object containing width, height, innerWidth, innerHeight and the passed margins.
 *
 * @example
 * ```ts
 * const dims = getDimensions(document.querySelector('#chart'), { top: 10, right: 10, bottom: 10, left: 10 });
 * ```
 */
export const getDimensions = (
  container: Element,
  margins: Margins,
): Dimensions => {
  const { height, width } = container.getBoundingClientRect();
  return {
    height,
    innerHeight: Math.max(0, height - margins.top - margins.bottom),
    innerWidth: Math.max(0, width - margins.left - margins.right),
    margins,
    width,
  };
};
