import type { ScaleLinear, ScaleLogarithmic, ScalePower, ScaleTime } from "d3";

/** Union of all supported D3 scale instances. */
export type AnyScale =
  | ScaleLinear<number, number>
  | ScaleLogarithmic<number, number>
  | ScalePower<number, number>
  | ScaleTime<number, number>;

/** Supported scale type identifiers. */
export type ScaleType = "linear" | "log" | "pow" | "time";

/** Minimal contract for scales used by axis and grid renderers. */
export interface TickableScale {
  (value: unknown): number;
  domain: () => unknown[];
  ticks: (count?: number) => unknown[];
}
