import type { SVGSelection, BoundsSelection, Margins } from "@/types/index.mjs";

/**
 * Selects or creates a single <g> element with class "bounds" inside the given SVG selection,
 * applies a translation using the provided margins (translate(margins.left, margins.top)),
 * and returns that group typed as a BoundsSelection.
 *
 * This performs a data join with a single null datum so an existing bounds group is reused
 * if present; otherwise a new <g class="bounds"> is appended. The function mutates the DOM.
 *
 * @param svg - The root SVG selection to contain the bounds group.
 * @param margins - Margins object providing left and top offsets for the translation.
 * @returns The selected or created group element cast to BoundsSelection.
 */
export const renderBoundsGroup = (
  svg: SVGSelection,
  margins: Margins,
): BoundsSelection =>
  svg
    .selectAll<SVGGElement, null>("g.bounds")
    .data([null])
    .join("g")
    .attr("class", "bounds")
    .attr(
      "transform",
      `translate(${margins.left},${margins.top})`,
    ) as unknown as BoundsSelection;
