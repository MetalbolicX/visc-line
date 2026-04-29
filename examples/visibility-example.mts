import { createChart } from "../src/index.mjs";
import { chartConfig } from "./data.mjs";

/**
 * Example demonstrating controlled series visibility.
 *
 * Consumer code owns the visibility state. The dropdown and legend
 * are both wired to the same state source, kept in sync.
 *
 * Library responsibility: renders D3 enter/update/exit for lines,
 * tooltip shows only visible series, zoom resets on toggle.
 */
export const main = (container: HTMLElement): void => {
  const chart = createChart(container, chartConfig, { xType: "time" })
    .withAxes()
    .withGrid()
    .withPoints()
    .withTooltip();

  // ── Consumer state: which series are visible ──────────────────────────────
  const allLabels = chart.allSeries.map((s) => s.label);
  // "All Series" | "Revenue" | "Cost"
  let selectedValue: "All Series" | string = "All Series";

  const applyVisibility = (): void => {
    const visible =
      selectedValue === "All Series"
        ? allLabels
        : [selectedValue];

    chart.withVisibleSeries(visible);
  };

  // ── Dropdown ───────────────────────────────────────────────────────────────
  const select = document.createElement("select");
  select.style.cssText = `
    font-family: sans-serif;
    font-size: 14px;
    padding: 4px 8px;
    margin-bottom: 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: #fff;
    cursor: pointer;
  `;
  select.appendChild(new Option("All Series", "All Series"));
  allLabels.forEach((label) => select.appendChild(new Option(label, label)));

  select.addEventListener("change", () => {
    selectedValue = select.value as typeof selectedValue;
    applyVisibility();
  });

  // Inject dropdown above the chart container
  container.parentElement?.insertBefore(select, container);
  container.style.display = "block";
  container.style.marginTop = "8px";

  // ── Interactive legend ──────────────────────────────────────────────────────
  chart.withLegend({
    interactive: true,
    items: chart.allSeries.map((s) => ({
      color: s.stroke ?? "steelblue",
      label: s.label,
    })),
    onToggle: (label, isVisible) => {
      // Toggle: if clicking a hidden series → show it; if clicking a visible one → hide it
      if (isVisible) {
        // User wants to SHOW this series
        // If "All Series" was selected, just keep it in the selection
        selectedValue = label;
      } else {
        // User wants to HIDE this series
        // If only one was left visible, switch to "All Series" (or leave empty)
        if (selectedValue === "All Series") {
          selectedValue = label; // switch to that single series
        } else if (selectedValue === label) {
          selectedValue = "All Series"; // deselected the active one
        }
        // Otherwise, user is hiding a non-selected series → no change needed
      }

      // Sync dropdown
      select.value = selectedValue;

      // Apply to chart
      if (selectedValue === "All Series") {
        chart.withVisibleSeries(allLabels);
      } else {
        chart.withVisibleSeries([selectedValue]);
      }
    },
  });

  // Initial render — all visible
  applyVisibility();
};