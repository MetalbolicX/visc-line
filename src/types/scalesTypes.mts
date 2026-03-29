import type { ScaleLinear, ScalePower, ScaleLogarithmic, ScaleTime } from "d3";

/** Union of all supported D3 scale instances. */
export type AnyScale =
  | ScaleLinear<number, number>
  | ScalePower<number, number>
  | ScaleLogarithmic<number, number>
  | ScaleTime<number, number>;

/** Supported scale type identifiers. */
export type ScaleType = "linear" | "pow" | "log" | "time";
