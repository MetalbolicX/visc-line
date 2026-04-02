import {
  scaleLinear,
  scalePow,
  scaleLog,
  scaleTime,
  type ScaleLinear,
} from "d3";
import type { ScaleType, AnyScale } from "@/types/index.mjs";

const SCALE_FACTORIES: Record<ScaleType, (exp?: number) => AnyScale> = {
  linear: () => scaleLinear(),
  pow: (exp = 2) => scalePow().exponent(exp),
  log: () => scaleLog(),
  time: () => scaleTime(),
};

/** Options for {@link createScales}. */
export interface CreateScalesOptions {
  xDomain: [unknown, unknown] | [undefined, undefined];
  yDomain: [number, number] | [undefined, undefined];
  innerWidth: number;
  innerHeight: number;
  xType?: ScaleType;
  yType?: ScaleType;
  xExponent?: number;
  yExponent?: number;
}

/** The pair of configured D3 scales returned by {@link createScales}. */
export interface ChartScales {
  xScale: AnyScale;
  yScale: AnyScale;
}

/**
 * Creates and returns x and y scales configured for a chart's inner drawing area.
 *
 * The function selects scale factories by the provided `xType` / `yType` (falling back to a linear
 * factory if an unknown type is supplied), configures each scale with the provided domain,
 * maps them to pixel ranges based on `innerWidth` / `innerHeight`, and applies `.nice()` for
 * rounded tick-friendly domains.
 *
 * @param options - Configuration options for scale creation.
 * @param options.xDomain - Domain for the x scale (expected as a two-element array, coerced to numbers).
 * @param options.yDomain - Domain for the y scale (values will be converted via `Number`).
 * @param options.innerWidth - Width in pixels of the chart's inner drawing area; x range is [0, innerWidth].
 * @param options.innerHeight - Height in pixels of the chart's inner drawing area; y range is [innerHeight, 0]
 *   (inverted to match screen coordinates).
 * @param options.xType - Identifier for the x scale factory to use (defaults to `"linear"`).
 * @param options.yType - Identifier for the y scale factory to use (defaults to `"linear"`).
 * @param options.xExponent - Exponent passed to the x scale factory when applicable (default: 2).
 * @param options.yExponent - Exponent passed to the y scale factory when applicable (default: 2).
 *
 * @returns ChartScales — an object containing `xScale` and `yScale`, each configured with domain, range and `.nice()`.
 */
export const createScales = ({
  xDomain,
  yDomain,
  innerWidth,
  innerHeight,
  xType = "linear",
  yType = "linear",
  xExponent = 2,
  yExponent = 2,
}: CreateScalesOptions): ChartScales => {
  const xScale = (
    (SCALE_FACTORIES[xType] ?? SCALE_FACTORIES.linear)(
      xExponent,
    ) as ScaleLinear<number, number>
  )
    .domain(xDomain as number[])
    .range([0, innerWidth])
    .nice() as AnyScale;
  const yScale = (
    (SCALE_FACTORIES[yType] ?? SCALE_FACTORIES.linear)(
      yExponent,
    ) as ScaleLinear<number, number>
  )
    .domain((yDomain as number[]).map(Number))
    .range([innerHeight, 0])
    .nice() as AnyScale;
  return { xScale, yScale };
};
