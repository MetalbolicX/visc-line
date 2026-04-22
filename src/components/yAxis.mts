import type { AxisDomain } from "d3";

import { axisLeft } from "d3";

import type { AnyScale, BoundsSelection } from "@/types/index.mjs";

/**
 * A scale compatible with D3 axis generators used in this module.
 *
 * We require `copy` because some D3 axis implementations may call it to
 * avoid mutating the original scale, and `range` to compute numeric extents
 * for tick placement. This narrows the loose `AnyScale` imported from the
 * project-types to the minimal surface this module relies on.
 */
type AxisCompatibleScale = AnyScale & Readonly<{
  readonly copy: () => unknown;
  readonly range: () => readonly number[];
}>;

/**
 * Configuration options for renderYAxis.
 *
 * - `tickCount`: preferred number of ticks to request from the axis generator.
 * - `tickFormat`: optional formatter for tick labels. Receives the domain value
 *   and tick index and must return the rendered string. The formatter is passed
 *   directly to D3's axis.tickFormat.
 */
interface RenderYAxisOptions {
  readonly tickCount?: number;
  readonly tickFormat?: (domainValue: AxisDomain, index: number) => string;
}

/**
 * Cast a generic scale to the AxisCompatibleScale used by the axis generator.
 * This is a narrow, identity cast kept local to avoid leaking relaxed types
 * across the codebase.
 */
const asAxisScale = (scale: AnyScale): AxisCompatibleScale => scale;

/**
 * Render a left-oriented Y axis into the provided bounds group.
 *
 * This will create or update a single <g class="y-axis"> element inside the
 * supplied `boundsGroup` and call a D3 left-axis generator configured with the
 * provided `yScale`. The function mutates the DOM under `boundsGroup` and
 * returns nothing.
 *
 * @param boundsGroup - D3 selection of the container group where the axis will be rendered.
 * @param yScale - D3 scale used to generate the axis. Must implement `copy()` and `range()`.
 * @param options - Optional configuration: `tickCount` (default 5) and `tickFormat`.
 * @example
 * ```ts
 * // basic usage
 * renderYAxis(boundsG, yScale, { tickCount: 6, tickFormat: (v) => `${v}%` });
 * ```
 */
export const renderYAxis = (
  boundsGroup: BoundsSelection,
  yScale: AnyScale,
  { tickCount = 5, tickFormat }: RenderYAxisOptions = {},
): void => {
  const axis = axisLeft(asAxisScale(yScale)).ticks(tickCount);
  if (tickFormat) axis.tickFormat(tickFormat);

  boundsGroup
    .selectAll<SVGGElement, null>("g.y-axis")
    .data([null])
    .join("g")
    .attr("class", "y-axis")
    .call(axis);
};
