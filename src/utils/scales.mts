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
 * Create and configure x and y scales for a cartesian line chart.
 *
 * @param options - Configuration options including domains, inner dimensions, and scale types.
 * @returns An object containing configured `xScale` and `yScale`.
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
