import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { defaultTheme } from "../../themes/defaultTheme.mjs";
import {
  applyThemeCssVars,
  readCssNumber,
} from "../../utils/cssVariables.mjs";

describe("applyThemeCssVars", () => {
  /**
   *
   */
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("writes --vl-background CSS variable", () => {
    applyThemeCssVars(container, defaultTheme);
    expect(container.style.getPropertyValue("--vl-background")).toBe(
      defaultTheme.colors.background,
    );
  });

  it("writes --vl-text CSS variable", () => {
    applyThemeCssVars(container, defaultTheme);
    expect(container.style.getPropertyValue("--vl-text")).toBe(
      defaultTheme.colors.text,
    );
  });

  it("writes --vl-axis-color CSS variable", () => {
    applyThemeCssVars(container, defaultTheme);
    expect(container.style.getPropertyValue("--vl-axis-color")).toBe(
      defaultTheme.colors.axis,
    );
  });

  it("writes --vl-grid-color CSS variable", () => {
    applyThemeCssVars(container, defaultTheme);
    expect(container.style.getPropertyValue("--vl-grid-color")).toBe(
      defaultTheme.colors.grid,
    );
  });

  it("writes palette colors with indexed --vl-palette-N vars", () => {
    applyThemeCssVars(container, defaultTheme);
    defaultTheme.colors.palette.forEach((color, i) => {
      expect(container.style.getPropertyValue(`--vl-palette-${String(i)}`)).toBe(color);
    });
  });

  it("writes --vl-axis-font-size with 'px' suffix", () => {
    applyThemeCssVars(container, defaultTheme);
    expect(container.style.getPropertyValue("--vl-axis-font-size")).toBe(
      `${String(defaultTheme.axis.fontSize)}px`,
    );
  });

  it("writes --vl-line-stroke-width as string", () => {
    applyThemeCssVars(container, defaultTheme);
    expect(container.style.getPropertyValue("--vl-line-stroke-width")).toBe(
      String(defaultTheme.line.strokeWidth),
    );
  });

  it("writes --vl-point-radius", () => {
    applyThemeCssVars(container, defaultTheme);
    expect(container.style.getPropertyValue("--vl-point-radius")).toBe(
      String(defaultTheme.points.radius),
    );
  });

  it("writes --vl-legend-font-size with px suffix", () => {
    applyThemeCssVars(container, defaultTheme);
    expect(container.style.getPropertyValue("--vl-legend-font-size")).toBe(
      `${String(defaultTheme.legend.fontSize)}px`,
    );
  });

  it("writes --vl-title-font-size with px suffix", () => {
    applyThemeCssVars(container, defaultTheme);
    expect(container.style.getPropertyValue("--vl-title-font-size")).toBe(
      `${String(defaultTheme.title.fontSize)}px`,
    );
  });

  it("writes label CSS vars", () => {
    applyThemeCssVars(container, defaultTheme);
    expect(container.style.getPropertyValue("--vl-label-color")).toBe(
      defaultTheme.label.color,
    );
    expect(container.style.getPropertyValue("--vl-label-font-size")).toBe(
      `${String(defaultTheme.label.fontSize)}px`,
    );
    expect(container.style.getPropertyValue("--vl-label-font-weight")).toBe(
      String(defaultTheme.label.fontWeight),
    );
    expect(container.style.getPropertyValue("--vl-label-padding")).toBe(
      `${String(defaultTheme.label.padding)}px`,
    );
  });

  it("writes --vl-grid-opacity", () => {
    applyThemeCssVars(container, defaultTheme);
    expect(container.style.getPropertyValue("--vl-grid-opacity")).toBe(
      String(defaultTheme.grid.opacity),
    );
  });

  it("writes --vl-grid-stroke-linecap", () => {
    applyThemeCssVars(container, defaultTheme);
    expect(container.style.getPropertyValue("--vl-grid-stroke-linecap")).toBe(
      defaultTheme.grid.strokeLinecap,
    );
  });

  it("always writes --vl-grid-dash-array (no null guard)", () => {
    applyThemeCssVars(container, defaultTheme);
    expect(container.style.getPropertyValue("--vl-grid-dash-array")).toBe(
      defaultTheme.grid.dashArray,
    );
  });

  it("writes --vl-point-opacity", () => {
    applyThemeCssVars(container, defaultTheme);
    expect(container.style.getPropertyValue("--vl-point-opacity")).toBe(
      String(defaultTheme.points.opacity),
    );
  });

  it("does not write tooltip vars when theme.tooltip is undefined", () => {
    applyThemeCssVars(container, {
      ...defaultTheme,
      tooltip: undefined,
    });
    expect(container.style.getPropertyValue("--vl-tooltip-bg")).toBe("");
  });

  it("writes all tooltip vars when theme.tooltip is provided", () => {
    const themeWithTooltip = {
      ...defaultTheme,
      tooltip: {
        background: "#fff",
        border: "1px solid #ccc",
        borderRadius: 4,
        color: "#222",
        fontSize: 12,
        padding: 8,
      },
    };
    applyThemeCssVars(container, themeWithTooltip);
    expect(container.style.getPropertyValue("--vl-tooltip-bg")).toBe("#fff");
    expect(container.style.getPropertyValue("--vl-tooltip-border")).toBe("1px solid #ccc");
    expect(container.style.getPropertyValue("--vl-tooltip-border-radius")).toBe("4px");
    expect(container.style.getPropertyValue("--vl-tooltip-font-size")).toBe("12px");
    expect(container.style.getPropertyValue("--vl-tooltip-color")).toBe("#222");
    expect(container.style.getPropertyValue("--vl-tooltip-padding")).toBe("8px");
  });

  it("does not write spacing or breakpoint vars", () => {
    applyThemeCssVars(container, defaultTheme);
    expect(container.style.getPropertyValue("--vl-spacing-sm")).toBe("");
    expect(container.style.getPropertyValue("--vl-spacing-md")).toBe("");
    expect(container.style.getPropertyValue("--vl-spacing-lg")).toBe("");
  });
});

describe("readCssNumber", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("returns the fallback when the CSS variable is missing", () => {
    expect(readCssNumber(container, "--vl-nonexistent", 8)).toBe(8);
  });

  it("returns the fallback when the CSS variable is empty", () => {
    container.style.setProperty("--vl-test-var", "");
    expect(readCssNumber(container, "--vl-test-var", 8)).toBe(8);
  });

  it("returns 0 when the CSS variable is the string '0' — NOT the fallback", () => {
    // This is the regression test: the old `|| 6` pattern treated 0 as falsy
    // and incorrectly returned 6 when --vl-point-radius was "0".
    container.style.setProperty("--vl-test-var", "0");
    expect(readCssNumber(container, "--vl-test-var", 99)).toBe(0);
  });

  it("returns the parsed number for a normal numeric value", () => {
    container.style.setProperty("--vl-test-var", "5");
    expect(readCssNumber(container, "--vl-test-var", 99)).toBe(5);
  });

  it("returns the fallback for non-numeric garbage", () => {
    container.style.setProperty("--vl-test-var", "abc");
    expect(readCssNumber(container, "--vl-test-var", 8)).toBe(8);
  });

  it("returns a negative number correctly", () => {
    container.style.setProperty("--vl-test-var", "-3");
    expect(readCssNumber(container, "--vl-test-var", 99)).toBe(-3);
  });

  it("accepts var names without the -- prefix", () => {
    container.style.setProperty("--vl-test-var", "42");
    expect(readCssNumber(container, "vl-test-var", 99)).toBe(42);
  });

  it("returns the fallback when the CSS variable is set to 'auto'", () => {
    container.style.setProperty("--vl-test-var", "auto");
    expect(readCssNumber(container, "--vl-test-var", 8)).toBe(8);
  });

  it("handles decimal values", () => {
    container.style.setProperty("--vl-test-var", "2.5");
    expect(readCssNumber(container, "--vl-test-var", 99)).toBe(2.5);
  });
});
