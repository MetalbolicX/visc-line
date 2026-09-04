import type { Theme } from "@/types/index.mjs";

/**
 * Writes theme tokens as CSS custom properties on the given root element.
 * This lets consumers override the chart appearance with plain CSS rules
 * that reference `var(--vl-*)` variables.
 *
 * @param root - The root element to apply CSS custom properties onto.
 * @param theme - The resolved theme object to write tokens from.
 *
 * @example
 * applyThemeCssVars(chartContainer, theme);
 * // then in CSS: .my-line { stroke: var(--vl-axis-color); }
 */
export const applyThemeCssVars = (root: HTMLElement, theme: Theme): void => {
  const { style } = root;

  style.setProperty("--vl-background", theme.colors.background);
  style.setProperty("--vl-text", theme.colors.text);
  style.setProperty("--vl-axis-color", theme.colors.axis);
  style.setProperty("--vl-grid-color", theme.colors.grid);
  theme.colors.palette.forEach((color, i) => {
    style.setProperty(`--vl-palette-${String(i)}`, color);
  });

  style.setProperty("--vl-axis-font-size", `${String(theme.axis.fontSize)}px`);
  style.setProperty("--vl-axis-tick-size", String(theme.axis.tickSize));
  style.setProperty("--vl-axis-tick-padding", String(theme.axis.tickPadding));

  style.setProperty("--vl-grid-stroke", theme.grid.stroke);
  style.setProperty("--vl-grid-stroke-width", String(theme.grid.strokeWidth));
  style.setProperty("--vl-grid-dash-array", theme.grid.dashArray);
  style.setProperty("--vl-grid-opacity", String(theme.grid.opacity));
  style.setProperty("--vl-grid-stroke-linecap", theme.grid.strokeLinecap);

  style.setProperty("--vl-line-stroke-width", String(theme.line.strokeWidth));
  style.setProperty("--vl-line-opacity", String(theme.line.opacity));

  style.setProperty("--vl-point-radius", String(theme.points.radius));
  style.setProperty("--vl-point-fill", theme.points.fill);
  style.setProperty("--vl-point-stroke", theme.points.stroke);
  style.setProperty("--vl-point-stroke-width", String(theme.points.strokeWidth));
  style.setProperty("--vl-point-opacity", String(theme.points.opacity));

  style.setProperty("--vl-legend-font-size", `${String(theme.legend.fontSize)}px`);
  style.setProperty("--vl-legend-item-spacing", `${String(theme.legend.itemSpacing)}px`);
  style.setProperty("--vl-legend-symbol-size", `${String(theme.legend.symbolSize)}px`);

  style.setProperty("--vl-label-color", theme.label.color);
  style.setProperty("--vl-label-font-size", `${String(theme.label.fontSize)}px`);
  style.setProperty("--vl-label-font-weight", String(theme.label.fontWeight));
  style.setProperty("--vl-label-padding", `${String(theme.label.padding)}px`);

  style.setProperty("--vl-title-font-size", `${String(theme.title.fontSize)}px`);
  style.setProperty("--vl-title-font-weight", String(theme.title.fontWeight));
  style.setProperty("--vl-title-color", theme.title.color);
  style.setProperty("--vl-title-padding", `${String(theme.title.padding)}px`);

  if (theme.tooltip) {
    style.setProperty("--vl-tooltip-bg", theme.tooltip.background);
    style.setProperty("--vl-tooltip-border", theme.tooltip.border);
    style.setProperty("--vl-tooltip-border-radius", `${String(theme.tooltip.borderRadius)}px`);
    style.setProperty("--vl-tooltip-padding", `${String(theme.tooltip.padding)}px`);
    style.setProperty("--vl-tooltip-font-size", `${String(theme.tooltip.fontSize)}px`);
    style.setProperty("--vl-tooltip-color", theme.tooltip.color);
    if (theme.tooltip.cursor) {
      style.setProperty("--vl-tooltip-cursor-color", theme.tooltip.cursor.color);
      style.setProperty("--vl-tooltip-cursor-dash-array", theme.tooltip.cursor.dashArray);
      style.setProperty("--vl-tooltip-cursor-dot-radius", String(theme.tooltip.cursor.dotRadius));
      style.setProperty("--vl-tooltip-cursor-dot-stroke", theme.tooltip.cursor.dotStroke);
      style.setProperty("--vl-tooltip-cursor-dot-stroke-width", String(theme.tooltip.cursor.dotStrokeWidth));
      style.setProperty("--vl-tooltip-cursor-stroke-width", String(theme.tooltip.cursor.lineStrokeWidth));
    }
  }

  if (theme.accessibility?.highContrast) {
    style.setProperty("--vl-grid-stroke", "#000000");
    style.setProperty("--vl-axis-color", "#000000");
    style.setProperty("--vl-line-stroke-width", "3");
    style.setProperty("--vl-point-stroke-width", "2");
    style.setProperty("--vl-text", "#000000");
  }
};

/**
 * Reads a numeric CSS custom property from an element and returns it as a number.
 *
 * Uses `Number.isFinite` (not `||` fallback) so that a literal `"0"` value is
 * returned as `0` rather than falling through to the fallback — the old `|| N`
 * pattern treated `0` as falsy and incorrectly returned the fallback.
 *
 * @param node - The element to read the CSS property from.
 * @param varName - The CSS custom property name (with or without `--` prefix;
 *   the prefix is added automatically if not present).
 * @param fallback - The value to return when the property is missing,
 *   empty, or its value cannot be parsed as a finite number.
 */
export const readCssNumber = (
  node: Element,
  varName: string,
  fallback: number,
): number => {
  const cssVarName = varName.startsWith("--") ? varName : `--${varName}`;
  const raw = parseFloat(getComputedStyle(node).getPropertyValue(cssVarName));
  return Number.isFinite(raw) ? raw : fallback;
};
