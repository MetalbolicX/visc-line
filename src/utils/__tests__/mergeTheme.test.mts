import { describe, expect, it } from "vitest";

import { defaultTheme } from "../../themes/defaultTheme.mjs";
import { mergeTheme } from "../../utils/mergeTheme.mjs";

describe("mergeTheme", () => {
  it("returns the base theme when no override is provided", () => {
    /**
     *
     */
    const result = mergeTheme(defaultTheme);
    expect(result).toEqual(defaultTheme);
  });

  it("does not mutate the original base theme", () => {
    /**
     *
     */
    const original = JSON.stringify(defaultTheme);
    mergeTheme(defaultTheme, { colors: { background: "#000" } });
    expect(JSON.stringify(defaultTheme)).toBe(original);
  });

  it("deep-merges nested objects", () => {
    /**
     *
     */
    const result = mergeTheme(defaultTheme, {
      colors: { background: "#000" },
    });
    expect(result.colors.background).toBe("#000");
    expect(result.colors.text).toBe(defaultTheme.colors.text);
  });

  it("overwrites primitive values from override", () => {
    /**
     *
     */
    const result = mergeTheme(defaultTheme, {
      line: { strokeWidth: 99 },
    });
    expect(result.line.strokeWidth).toBe(99);
    expect(result.line.opacity).toBe(defaultTheme.line.opacity);
  });

  it("replaces arrays wholesale (does not merge)", () => {
    /**
     *
     */
    const customPalette = ["#a", "#b", "#c"];
    /**
     *
     */
    const result = mergeTheme(defaultTheme, {
      colors: { palette: customPalette },
    });
    expect(result.colors.palette).toEqual(customPalette);
    expect(result.colors.palette).not.toBe(defaultTheme.colors.palette);
  });

  it("ignores undefined values in override", () => {
    /**
     *
     */
    const result = mergeTheme(defaultTheme, {
      line: { strokeWidth: undefined },
    } as Parameters<typeof mergeTheme>[1]);
    expect(result.line.strokeWidth).toBe(defaultTheme.line.strokeWidth);
  });

  it("deep-merges multiple levels of nesting", () => {
    /**
     *
     */
    const result = mergeTheme(defaultTheme, {
      title: { fontSize: 99 },
    });
    expect(result.title.fontSize).toBe(99);
    expect(result.title.fontWeight).toBe(defaultTheme.title.fontWeight);
    expect(result.title.color).toBe(defaultTheme.title.color);
  });

  it("handles empty override object (returns base)", () => {
    /**
     *
     */
    const result = mergeTheme(defaultTheme, {});
    expect(result).toEqual(defaultTheme);
  });

  it("can add previously undefined optional keys", () => {
    /**
     *
     */
    const result = mergeTheme(defaultTheme, {
      tooltip: {
        background: "#111",
        border: "#222",
        borderRadius: 8,
        color: "#333",
        fontSize: 13,
        padding: 12,
      },
    });
    expect(result.tooltip).toBeDefined();
    expect(result.tooltip?.background).toBe("#111");
  });
});
