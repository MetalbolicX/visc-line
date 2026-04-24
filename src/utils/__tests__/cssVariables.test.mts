import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { defaultTheme } from "../../themes/defaultTheme.mjs";
import {
  applyThemeCssVars,
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
