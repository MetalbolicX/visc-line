import { select } from "d3";

import type { SVGSelection } from "@/types/index.mjs";

/**
 * Renders (creates or updates) a single SVG element inside the given container.
 *
 * Ensures exactly one `<svg>` is bound to the container, sets its width and
 * height to the container's `clientWidth` / `clientHeight`, and applies the
 * chart background colour via the `--vl-background` CSS custom property
 * written by {@link applyThemeCssVars}.
 *
 * @param container - The DOM element that will contain the SVG.
 * @param ariaLabel - Optional ARIA label for accessibility.
 * @returns D3 selection for the created or updated `<svg>` element.
 */
export const renderSVG = (
  container: HTMLElement,
  ariaLabel?: string,
): SVGSelection => {
  const selection = select(container)
    .selectAll<SVGSVGElement, null>("svg")
    .data([null])
    .join("svg")
    .attr("width", container.clientWidth)
    .attr("height", container.clientHeight)
    .style("background", "var(--vl-background, white)")
    .style("overflow", "visible")
    .attr("role", "img");
  if (ariaLabel) {
    selection.attr("aria-label", ariaLabel).attr("aria-hidden", null);
  } else {
    selection.attr("aria-hidden", "true");
  }
  return selection;
};
