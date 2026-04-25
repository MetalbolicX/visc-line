import type { AnyScale, TickableScale } from "@/types/index.mjs";

/**
 * Type-safe cast of AnyScale to a scale function that accepts `unknown` and
 * returns `number`. Use this when D3's flexible scale types cause TypeScript
 * to reject direct usage in generic contexts.
 *
 * @param scale - The AnyScale to cast.
 * @returns The scale as a function from unknown to number.
 */
export const asScaleNumber = (
  scale: AnyScale,
): ((v: unknown) => number) => scale as unknown as (v: unknown) => number;

/**
 * Type-safe cast of AnyScale to a scale with an `invert` method (pixel → domain).
 * Use this when you need to call `scale.invert(pixelValue)` for mouse/touch coordinate
 * mapping back to data values.
 *
 * @param scale - The AnyScale to cast.
 * @returns The scale with invert method.
 */
export const asInvertibleScale = (
  scale: AnyScale,
): { invert: (v: number) => unknown } =>
  scale as unknown as { invert: (v: number) => unknown };

/**
 * Type-safe cast of AnyScale to a TickableScale (one that exposes `domain()`
 * and `ticks()`). Use this for grid and axis renderers that consume these
 * methods without needing the full ScaleLinear/ScaleTime union.
 *
 * @param scale - The AnyScale to cast.
 * @returns The scale as a TickableScale.
 */
export const asTickable = (scale: AnyScale): TickableScale =>
  scale as unknown as TickableScale;