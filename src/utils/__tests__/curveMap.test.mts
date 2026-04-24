import { curveLinear } from "d3";
import { describe, expect, it } from "vitest";

import type { CurvePreset } from "../../types/index.mjs";

import { CURVE_PRESETS, resolveCurve } from "../../utils/curveMap.mjs";

const ALL_PRESETS: readonly CurvePreset[] = [
  "basis",
  "basisClosed",
  "basisOpen",
  "bumpX",
  "bumpY",
  "cardinal",
  "cardinalClosed",
  "cardinalOpen",
  "catmullRom",
  "catmullRomClosed",
  "catmullRomOpen",
  "linear",
  "monotoneX",
  "monotoneY",
  "natural",
  "step",
  "stepAfter",
  "stepBefore",
];

describe("CURVE_PRESETS", () => {
  it("contains exactly 18 entries", () => {
    expect(Object.keys(CURVE_PRESETS)).toHaveLength(18);
  });

  it.each(ALL_PRESETS)("'%s' maps to a function", (preset) => {
    expect(typeof CURVE_PRESETS[preset]).toBe("function");
  });
});

describe("resolveCurve", () => {
  it.each(ALL_PRESETS)("resolves preset string '%s' to a function", (preset) => {
    const factory = resolveCurve(preset);
    expect(typeof factory).toBe("function");
    expect(factory).toBe(CURVE_PRESETS[preset]);
  });

  it("passes through a CurveFactory unchanged", () => {
    const result = resolveCurve(curveLinear);
    expect(result).toBe(curveLinear);
  });

  it("throws for an unknown preset string", () => {
    expect(() => resolveCurve("nonexistent" as CurvePreset)).toThrow(
      'Unknown curve preset: "nonexistent"',
    );
  });
});
