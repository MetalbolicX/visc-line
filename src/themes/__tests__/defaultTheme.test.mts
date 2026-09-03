import { describe, expect, it } from "vitest";

import { defaultTheme } from "../defaultTheme.mjs";

describe("defaultTheme", () => {
  describe("shape and value types", () => {
    it("has all required top-level sections", () => {
      expect(defaultTheme).toHaveProperty("accessibility");
      expect(defaultTheme).toHaveProperty("axis");
      expect(defaultTheme).toHaveProperty("colors");
      expect(defaultTheme).toHaveProperty("grid");
      expect(defaultTheme).toHaveProperty("legend");
      expect(defaultTheme).toHaveProperty("label");
      expect(defaultTheme).toHaveProperty("line");
      expect(defaultTheme).toHaveProperty("points");
      expect(defaultTheme).toHaveProperty("title");
      expect(defaultTheme).toHaveProperty("tooltip");
    });

    it("accessibility has highContrast and reducedMotion booleans", () => {
      expect(typeof defaultTheme.accessibility.highContrast).toBe("boolean");
      expect(typeof defaultTheme.accessibility.reducedMotion).toBe("boolean");
    });

    it("axis has numeric styling properties", () => {
      expect(typeof defaultTheme.axis.color).toBe("string");
      expect(typeof defaultTheme.axis.fontSize).toBe("number");
      expect(typeof defaultTheme.axis.tickPadding).toBe("number");
      expect(typeof defaultTheme.axis.tickSize).toBe("number");
    });

    it("colors has all required color tokens", () => {
      expect(typeof defaultTheme.colors.axis).toBe("string");
      expect(typeof defaultTheme.colors.background).toBe("string");
      expect(typeof defaultTheme.colors.grid).toBe("string");
      expect(typeof defaultTheme.colors.text).toBe("string");
      expect(Array.isArray(defaultTheme.colors.palette)).toBe(true);
      expect(defaultTheme.colors.palette.length).toBeGreaterThan(0);
    });

    it("grid has numeric styling properties", () => {
      expect(typeof defaultTheme.grid.dashArray).toBe("string");
      expect(typeof defaultTheme.grid.opacity).toBe("number");
      expect(typeof defaultTheme.grid.stroke).toBe("string");
      expect(typeof defaultTheme.grid.strokeLinecap).toBe("string");
      expect(typeof defaultTheme.grid.strokeWidth).toBe("number");
    });

    it("legend has numeric styling properties", () => {
      expect(typeof defaultTheme.legend.fontSize).toBe("number");
      expect(typeof defaultTheme.legend.itemSpacing).toBe("number");
      expect(typeof defaultTheme.legend.position).toBe("string");
      expect(typeof defaultTheme.legend.symbolSize).toBe("number");
    });

    it("label has numeric styling properties", () => {
      expect(typeof defaultTheme.label.color).toBe("string");
      expect(typeof defaultTheme.label.fontSize).toBe("number");
      expect(typeof defaultTheme.label.fontWeight).toBe("number");
      expect(typeof defaultTheme.label.padding).toBe("number");
    });

    it("line has numeric styling properties", () => {
      expect(typeof defaultTheme.line.curve).toBe("string");
      expect(typeof defaultTheme.line.opacity).toBe("number");
      expect(typeof defaultTheme.line.strokeWidth).toBe("number");
    });

    it("points has numeric styling properties", () => {
      expect(typeof defaultTheme.points.fill).toBe("string");
      expect(typeof defaultTheme.points.opacity).toBe("number");
      expect(typeof defaultTheme.points.radius).toBe("number");
      expect(typeof defaultTheme.points.stroke).toBe("string");
      expect(typeof defaultTheme.points.strokeWidth).toBe("number");
    });

    it("title has numeric styling properties", () => {
      expect(typeof defaultTheme.title.color).toBe("string");
      expect(typeof defaultTheme.title.fontSize).toBe("number");
      expect(typeof defaultTheme.title.fontWeight).toBe("number");
      expect(typeof defaultTheme.title.padding).toBe("number");
    });

    it("tooltip has numeric styling properties", () => {
      expect(typeof defaultTheme.tooltip.background).toBe("string");
      expect(typeof defaultTheme.tooltip.border).toBe("string");
      expect(typeof defaultTheme.tooltip.borderRadius).toBe("number");
      expect(typeof defaultTheme.tooltip.color).toBe("string");
      expect(typeof defaultTheme.tooltip.fontSize).toBe("number");
      expect(typeof defaultTheme.tooltip.padding).toBe("number");
    });
  });

  describe("numeric CSS var invariants (finite, > 0)", () => {
    // These invariants are verified by plan 009's CSS-var fallback fix.
    // Every numeric --vl-* default must be a finite number > 0.

    const numericPaths: Array<{ path: string; value: number }> = [];

    // axis
    numericPaths.push({ path: "axis.fontSize", value: defaultTheme.axis.fontSize });
    numericPaths.push({ path: "axis.tickPadding", value: defaultTheme.axis.tickPadding });
    numericPaths.push({ path: "axis.tickSize", value: defaultTheme.axis.tickSize });

    // grid
    numericPaths.push({ path: "grid.opacity", value: defaultTheme.grid.opacity });
    numericPaths.push({ path: "grid.strokeWidth", value: defaultTheme.grid.strokeWidth });

    // legend
    numericPaths.push({ path: "legend.fontSize", value: defaultTheme.legend.fontSize });
    numericPaths.push({ path: "legend.itemSpacing", value: defaultTheme.legend.itemSpacing });
    numericPaths.push({ path: "legend.symbolSize", value: defaultTheme.legend.symbolSize });

    // label
    numericPaths.push({ path: "label.fontSize", value: defaultTheme.label.fontSize });
    numericPaths.push({ path: "label.fontWeight", value: defaultTheme.label.fontWeight });
    numericPaths.push({ path: "label.padding", value: defaultTheme.label.padding });

    // line
    numericPaths.push({ path: "line.opacity", value: defaultTheme.line.opacity });
    numericPaths.push({ path: "line.strokeWidth", value: defaultTheme.line.strokeWidth });

    // points
    numericPaths.push({ path: "points.opacity", value: defaultTheme.points.opacity });
    numericPaths.push({ path: "points.radius", value: defaultTheme.points.radius });
    numericPaths.push({ path: "points.strokeWidth", value: defaultTheme.points.strokeWidth });

    // title
    numericPaths.push({ path: "title.fontSize", value: defaultTheme.title.fontSize });
    numericPaths.push({ path: "title.fontWeight", value: defaultTheme.title.fontWeight });
    numericPaths.push({ path: "title.padding", value: defaultTheme.title.padding });

    // tooltip
    numericPaths.push({ path: "tooltip.borderRadius", value: defaultTheme.tooltip.borderRadius });
    numericPaths.push({ path: "tooltip.fontSize", value: defaultTheme.tooltip.fontSize });
    numericPaths.push({ path: "tooltip.padding", value: defaultTheme.tooltip.padding });

    numericPaths.forEach(({ path, value }) => {
      it(`${path} (${value}) is finite`, () => {
        expect(Number.isFinite(value)).toBe(true);
      });
    });

    numericPaths.forEach(({ path, value }) => {
      it(`${path} (${value}) is greater than 0`, () => {
        expect(value).toBeGreaterThan(0);
      });
    });

    it("no numeric value is exactly zero", () => {
      const allValues = numericPaths.map((n) => n.value);
      allValues.forEach((v) => {
        expect(v).not.toBe(0);
      });
    });
  });
});
