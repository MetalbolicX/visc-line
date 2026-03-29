import { select } from "d3";
import type { SVGSelection } from "@/types/index.mjs";

/**
 * Renders (creates or updates) a single SVG element inside the given container using D3.
 *
 * Ensures exactly one `<svg>` is bound to the container, sets its width and height
 * to the container's `clientWidth` and `clientHeight`, applies the provided background
 * color, and sets overflow to `"visible"`.
 *
 * @param container - The DOM element that will contain the SVG.
 * @param options - Optional configuration.
 * @param options.background - Background color for the SVG. Defaults to `"white"`.
 * @returns D3 selection for the created or updated `<svg>` element.
 */
export const renderSVG = (
  container: HTMLElement,
  { background = "white" }: { background?: string } = {},
): SVGSelection =>
  select(container)
    .selectAll<SVGSVGElement, null>("svg")
    .data([null])
    .join("svg")
    .attr("width", container.clientWidth)
    .attr("height", container.clientHeight)
    .style("background", background)
    .style("overflow", "visible") as unknown as SVGSelection;
