import { describe, expect, it } from "vitest";

import type { CurvePreset } from "../../types/index.mts";

import { defaultTheme } from "../../themes/defaultTheme.mts";

describe("CurvePreset", () => {
  /**
   *
   */
  const validCurves: CurvePreset[] = [
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

  it.each(validCurves)("'%s' is a valid CurvePreset", (curve) => {
    /**
     *
     */
    const theme = { ...defaultTheme, line: { ...defaultTheme.line, curve } };
    expect(theme.line.curve).toBe(curve);
  });
});

describe("Theme type", () => {
  it("line.curve is typed as CurvePreset (not plain string)", () => {
    /**
     *
     */
    const validTheme = {
      ...defaultTheme,
      line: { ...defaultTheme.line, curve: "monotoneX" as const },
    };
    expect(validTheme.line.curve).toBe("monotoneX");
  });

  it("axis.color is optional in Theme definition", () => {
    /**
     *
     */
    const themeWithoutAxisColor = {
      ...defaultTheme,
      axis: { ...defaultTheme.axis, color: undefined },
    };
    expect(themeWithoutAxisColor.axis.color).toBeUndefined();
  });

  it("tooltip is optional in Theme definition", () => {
    /**
     *
     */
    const themeWithoutTooltip = {
      ...defaultTheme,
      tooltip: undefined,
    } as { tooltip?: typeof defaultTheme.tooltip };
    expect(themeWithoutTooltip.tooltip).toBeUndefined();
  });

  it("accessibility is optional in Theme definition", () => {
    /**
     *
     */
    const themeWithoutAccessibility = {
      ...defaultTheme,
      accessibility: undefined,
    } as { accessibility?: typeof defaultTheme.accessibility };
    expect(themeWithoutAccessibility.accessibility).toBeUndefined();
  });
});