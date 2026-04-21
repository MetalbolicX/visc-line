import { describe, expect, it } from "vitest";

import { defaultTheme } from "../../themes/defaultTheme.mts";
import {
  applyThemeCssVars,
} from "../../utils/cssVariables.mts";

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
      expect(container.style.getPropertyValue(`--vl-palette-${i}`)).toBe(color);
    });
  });

  it("writes --vl-axis-font-size with 'px' suffix", () => {
    applyThemeCssVars(container, defaultTheme);
    expect(container.style.getPropertyValue("--vl-axis-font-size")).toBe(
      `${defaultTheme.axis.fontSize}px`,
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
      `${defaultTheme.legend.fontSize}px`,
    );
  });

  it("writes --vl-title-font-size with px suffix", () => {
    applyThemeCssVars(container, defaultTheme);
    expect(container.style.getPropertyValue("--vl-title-font-size")).toBe(
      `${defaultTheme.title.fontSize}px`,
    );
  });

  it("does not write tooltip vars when theme.tooltip is undefined", () => {
    applyThemeCssVars(container, {
      ...defaultTheme,
      tooltip: undefined,
    } as typeof defaultTheme);
    expect(container.style.getPropertyValue("--vl-tooltip-bg")).toBe("");
  });

  it("writes tooltip vars when theme.tooltip is provided", () => {
    /**
     *
     */
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
    expect(container.style.getPropertyValue("--vl-tooltip-font-size")).toBe("12px");
  });

  it("writes spacing small, medium, and large", () => {
    applyThemeCssVars(container, defaultTheme);
    expect(container.style.getPropertyValue("--vl-spacing-sm")).toBe(
      `${defaultTheme.spacing.small}px`,
    );
    expect(container.style.getPropertyValue("--vl-spacing-md")).toBe(
      `${defaultTheme.spacing.medium}px`,
    );
    expect(container.style.getPropertyValue("--vl-spacing-lg")).toBe(
      `${defaultTheme.spacing.large}px`,
    );
  });
});