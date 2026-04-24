import type { CurveFactory } from "d3";

import {
  curveBasis,
  curveBasisClosed,
  curveBasisOpen,
  curveBumpX,
  curveBumpY,
  curveCardinal,
  curveCardinalClosed,
  curveCardinalOpen,
  curveCatmullRom,
  curveCatmullRomClosed,
  curveCatmullRomOpen,
  curveLinear,
  curveMonotoneX,
  curveMonotoneY,
  curveNatural,
  curveStep,
  curveStepAfter,
  curveStepBefore,
} from "d3";

import type { CurvePreset } from "@/types/index.mjs";

/**
 * Mapping of all supported curve preset names to their D3 curve factory.
 *
 * Can be used to enumerate valid preset names or to resolve a preset string
 * independently of the render functions.
 *
 * @example
 * ```ts
 * const factory = CURVE_PRESETS["monotoneX"];
 * ```
 */
export const CURVE_PRESETS: Readonly<Record<CurvePreset, CurveFactory>> = {
  basis: curveBasis,
  basisClosed: curveBasisClosed,
  basisOpen: curveBasisOpen,
  bumpX: curveBumpX,
  bumpY: curveBumpY,
  cardinal: curveCardinal,
  cardinalClosed: curveCardinalClosed,
  cardinalOpen: curveCardinalOpen,
  catmullRom: curveCatmullRom,
  catmullRomClosed: curveCatmullRomClosed,
  catmullRomOpen: curveCatmullRomOpen,
  linear: curveLinear,
  monotoneX: curveMonotoneX,
  monotoneY: curveMonotoneY,
  natural: curveNatural,
  step: curveStep,
  stepAfter: curveStepAfter,
  stepBefore: curveStepBefore,
};

/**
 * Resolves a curve preset name or an already-resolved D3 CurveFactory to a
 * CurveFactory that can be passed to a D3 line generator.
 *
 * @param input - A {@link CurvePreset} string (e.g. `"monotoneX"`) or a D3
 *   CurveFactory function.
 * @returns The corresponding D3 CurveFactory.
 * @throws {Error} If `input` is a string that does not match any known preset.
 *
 * @example
 * ```ts
 * const factory = resolveCurve("monotoneX");
 * const sameFactory = resolveCurve(curveMonotoneX); // pass-through
 * ```
 */
export const resolveCurve = (input: CurveFactory | CurvePreset): CurveFactory => {
  if (typeof input !== "string") return input;
  const factory = CURVE_PRESETS[input];
  if (!factory) throw new Error(`Unknown curve preset: "${input}"`);
  return factory;
};
