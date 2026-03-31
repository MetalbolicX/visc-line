import type { Margins, Dimensions } from "@/types/index.mjs";

/**
 * Compute outer and inner drawing dimensions from a container element and margin values.
 *
 * @param container - DOM element used to determine available size via `getBoundingClientRect()`.
 * @param margins - Margins to subtract from the container's width and height.
 * @returns An object containing width, height, innerWidth, innerHeight, and margins.
 */
export const getDimensions = (
  container: Element,
  margins: Margins,
): Dimensions => {
  const { width, height } = container.getBoundingClientRect();
  return {
    width,
    height,
    innerWidth: Math.max(0, width - margins.left - margins.right),
    innerHeight: Math.max(0, height - margins.top - margins.bottom),
    margins,
  };
};
