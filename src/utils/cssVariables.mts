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
export /**
        *
        */
const applyThemeCssVars = (root: HTMLElement, theme: Theme): void => {
  /**
   *
   */
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
  if (theme.grid.dashArray) {
    style.setProperty("--vl-grid-dash-array", theme.grid.dashArray);
  }

  style.setProperty("--vl-line-stroke-width", String(theme.line.strokeWidth));
  style.setProperty("--vl-line-opacity", String(theme.line.opacity));

  style.setProperty("--vl-point-radius", String(theme.points.radius));
  style.setProperty("--vl-point-fill", theme.points.fill);
  style.setProperty("--vl-point-stroke", theme.points.stroke);
  style.setProperty("--vl-point-stroke-width", String(theme.points.strokeWidth));

  style.setProperty("--vl-legend-font-size", `${String(theme.legend.fontSize)}px`);
  style.setProperty("--vl-legend-item-spacing", `${String(theme.legend.itemSpacing)}px`);
  style.setProperty("--vl-legend-symbol-size", `${String(theme.legend.symbolSize)}px`);

  style.setProperty("--vl-title-font-size", `${String(theme.title.fontSize)}px`);
  style.setProperty("--vl-title-font-weight", String(theme.title.fontWeight));
  style.setProperty("--vl-title-color", theme.title.color);
  style.setProperty("--vl-title-padding", `${String(theme.title.padding)}px`);

  if (theme.tooltip) {
    style.setProperty("--vl-tooltip-bg", theme.tooltip.background);
    style.setProperty("--vl-tooltip-border-radius", `${String(theme.tooltip.borderRadius)}px`);
    style.setProperty("--vl-tooltip-padding", `${String(theme.tooltip.padding)}px`);
    style.setProperty("--vl-tooltip-font-size", `${String(theme.tooltip.fontSize)}px`);
    style.setProperty("--vl-tooltip-color", theme.tooltip.color);
  }

  style.setProperty("--vl-spacing-sm", `${String(theme.spacing.small)}px`);
  style.setProperty("--vl-spacing-md", `${String(theme.spacing.medium)}px`);
  style.setProperty("--vl-spacing-lg", `${String(theme.spacing.large)}px`);
};