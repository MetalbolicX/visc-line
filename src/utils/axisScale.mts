import type { AnyScale } from "@/types/index.mjs";

type AxisCompatibleScale = AnyScale &
  Readonly<{
    readonly copy: () => unknown;
    readonly range: () => readonly number[];
  }>;

const asAxisScale = (scale: AnyScale): AxisCompatibleScale => scale;

export type { AxisCompatibleScale };
export { asAxisScale };
