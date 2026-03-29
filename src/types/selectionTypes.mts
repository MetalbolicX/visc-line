import type { Selection } from "d3";

/**
 * A D3 selection of an `<svg>` element with a `null` datum.
 * The parent element type is intentionally widened to accommodate any parent.
 */
export type SVGSelection = Selection<
  SVGSVGElement,
  null,
  Element | null,
  unknown
>;

/**
 * A D3 selection of an SVG `<g>` element (bounds group) with a `null` datum.
 */
export type BoundsSelection = Selection<
  SVGGElement,
  null,
  SVGSVGElement | null,
  unknown
>;
