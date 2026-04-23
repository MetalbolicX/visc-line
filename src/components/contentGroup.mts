import type { BoundsSelection, SVGSelection } from "@/types/index.mjs";

/** Unique id for the chart content clip-path. */
const CLIP_PATH_ID = "chart-content-clip";

/** Options for {@link renderContentGroup}. */
interface RenderContentGroupOptions {
  readonly innerHeight: number;
  readonly innerWidth: number;
}

/**
 * Selects or creates a `<g class="content">` element inside the bounds group and
 * constrains it to the inner drawing area via a `<clipPath>`.
 *
 * A `<clipPath id="chart-content-clip">` is upserted in the root SVG's `<defs>` and
 * sized to `innerWidth × innerHeight`. The content group gets `clip-path` applied so
 * that lines, points, and grid content stay within the plotting area during pan and
 * zoom interactions. Axes are rendered on the bounds group and remain unclipped.
 *
 * @param bounds - The bounds group selection that will contain the content group.
 * @param svg - The root SVG selection used to create the `<defs>` and `<clipPath>`.
 * @param options - Inner dimensions used to size the clip rectangle.
 * @returns The content group selection.
 */
export const renderContentGroup = (
  bounds: BoundsSelection,
  svg: SVGSelection,
  { innerHeight, innerWidth }: RenderContentGroupOptions,
): BoundsSelection => {
  // Upsert <defs> + <clipPath> on the root SVG.
  const defs = svg
    .selectAll<SVGDefsElement, null>("defs")
    .data([null])
    .join("defs");

  defs
    .selectAll<SVGClipPathElement, null>(`clipPath#${CLIP_PATH_ID}`)
    .data([null])
    .join("clipPath")
    .attr("id", CLIP_PATH_ID)
    .selectAll<SVGRectElement, null>("rect")
    .data([null])
    .join("rect")
    .attr("width", innerWidth)
    .attr("height", innerHeight);

  return bounds
    .selectAll<SVGGElement, null>("g.content")
    .data([null])
    .join("g")
    .attr("class", "content")
    .attr("clip-path", `url(#${CLIP_PATH_ID})`) as BoundsSelection;
};
