import type { AnyScale, BoundsSelection, SVGSelection } from "@/types/index.mjs";
import type { Dimensions } from "@/types/index.mjs";

export type CustomCallback = (
  ctx: CustomContext,
) => (() => void) | void;

export interface CustomContext {
  readonly bounds: BoundsSelection;
  readonly content: BoundsSelection;
  readonly dims: Dimensions;
  readonly svg: SVGSelection;
  readonly xScale: AnyScale;
  readonly yScale: AnyScale;
}
