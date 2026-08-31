# Tutorial

This page walks you through four practical examples that build from a bare-minimum chart to a fully interactive, customizable visualization. Each example introduces one new concept so you can learn incrementally.

---

## 1. Minimal Chart

The simplest possible chart: mount it, give it data, and you're done. No axes, no labels, no tooltip — just the lines.

```ts
import { createChart } from "visc-line";

interface ExamRecord {
  hours: number;
  aliceScore: number;
  bobScore: number;
}

const data: ExamRecord[] = [
  { hours: 1, aliceScore: 45, bobScore: 30 },
  { hours: 2, aliceScore: 52, bobScore: 48 },
  { hours: 3, aliceScore: 61, bobScore: 55 },
  { hours: 4, aliceScore: 70, bobScore: 63 },
  { hours: 5, aliceScore: 78, bobScore: 71 },
  { hours: 6, aliceScore: 85, bobScore: 80 },
  { hours: 7, aliceScore: 91, bobScore: 88 },
  { hours: 8, aliceScore: 95, bobScore: 94 },
];

const container = document.getElementById("chart")!;

createChart(container, {
  data,
  xSerie: { accessor: (d) => d.hours, label: "Study Hours" },
  ySeries: [
    { accessor: (d) => d.aliceScore, label: "Alice", stroke: "steelblue" },
    { accessor: (d) => d.bobScore, label: "Bob", stroke: "tomato" },
  ],
}, { xType: "linear" });
```


> **Key points:**
>
> - `xSerie.accessor` returns the **x** value for each record.
> - `ySeries` is an **array** — one entry per line on the chart.
> - The third argument `{ xType: "linear" }` tells the chart to use a linear scale for the x-axis (the default is `"time"`).
> - Without calling any `.with*()` method, you get a clean chart with **only the lines**.

---

## 2. Adding Axes, Legend, and Title

The real power of the builder pattern: you chain `.with*()` methods to opt into exactly the features you need. Call order does not matter — each method sets a feature flag and triggers a full re-render.

```ts
import { createChart } from "visc-line";

// Data and types same as Example 1 …

const chart = createChart(container, {
  data,
  xSerie: { accessor: (d) => d.hours, label: "Study Hours" },
  ySeries: [
    { accessor: (d) => d.aliceScore, label: "Alice", stroke: "steelblue" },
    { accessor: (d) => d.bobScore, label: "Bob", stroke: "tomato" },
  ],
}, { xType: "linear" })
  .withTitle({ title: "Exam Scores vs. Study Time" })
  .withAxes()
  .withGrid()
  .withLegend();
```


> **What each method does:**
>
> | Method | Effect |
> |--------|--------|
> | `.withTitle()` | Renders a title above the chart |
> | `.withAxes()` | Adds x-axis (bottom) and y-axis (left) with automatic tick labels |
> | `.withGrid()` | Draws horizontal and vertical grid lines behind the data |
> | `.withLegend()` | Places a legend box — items are auto-derived from `ySeries` (label + color) |

You can also customize axis tick formatting:

```ts
chart.withAxes({
  xTickFormat: (d) => `${d}h`,
  yTickCount: 8,
});
```

---

## 3. Interactivity with a Custom Tooltip

The default tooltip shows the x value and each series' y value. But you can take full control with `tooltipHtml` to design exactly what the tooltip displays.

```ts
import { createChart } from "visc-line";
import type { TooltipData } from "visc-line";

// Data and types same as Example 1 …

const chart = createChart(container, {
  data,
  xSerie: { accessor: (d) => d.hours, label: "Study Hours" },
  ySeries: [
    { accessor: (d) => d.aliceScore, label: "Alice", stroke: "steelblue" },
    { accessor: (d) => d.bobScore, label: "Bob", stroke: "tomato" },
  ],
}, { xType: "linear" })
  .withTitle({ title: "Exam Scores vs. Study Time" })
  .withAxes()
  .withGrid()
  .withLegend()
  .withTooltip({
    formatX: (v) => `${String(v)} hours`,
    formatY: (v) => `${v} pts`,
    tooltipHtml: (data: TooltipData) => `
      <div style="font-family: sans-serif; font-size: 13px;">
        <strong>${data.x}</strong>
        ${data.series.map((s) => `
          <div style="display: flex; align-items: center; gap: 6px; margin-top: 4px;">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;
                         background:${s.color};"></span>
            <span>${s.label}: <strong>${s.value}</strong></span>
          </div>
        `).join("")}
      </div>
    `,
  });
```

The `TooltipData` object passed to `tooltipHtml` has this shape:

| Field    | Type                                   | Description                        |
|----------|----------------------------------------|------------------------------------|
| `x`      | `string`                               | Formatted x value                  |
| `series` | `{ label: string; value: string; color: string }[]` | One entry per visible series |

> The tooltip is **interactive by default** — hover anywhere on the chart and it shows a vertical cursor line with dots at each series' value. The `tooltipHtml` option only replaces the **content** of the tooltip box.

You can also pass `formatX` and `formatY` without `tooltipHtml` for simple formatting:

```ts
chart.withTooltip({
  formatX: (v) => new Date(v as number).toLocaleDateString(),
  formatY: (v) => `$${v}`,
});
```

---

## 4. Changing the Dataset

Use the `update()` method to swap data without rebuilding the chart. The chart preserves its configuration (axes, legend, tooltip, etc.) and re-renders with new values.

This is useful for dashboards, live-updating charts, or switching between data views (e.g., daily / weekly / monthly).

```ts
import { createChart } from "visc-line";

// Data set A: study hours
const studyData: ExamRecord[] = [
  { hours: 1, aliceScore: 45, bobScore: 30 },
  { hours: 2, aliceScore: 52, bobScore: 48 },
  // …
];

// Data set B: quiz scores (same shape, different values)
const quizData: ExamRecord[] = [
  { hours: 1, aliceScore: 38, bobScore: 42 },
  { hours: 2, aliceScore: 50, bobScore: 50 },
  { hours: 3, aliceScore: 59, bobScore: 58 },
  { hours: 4, aliceScore: 67, bobScore: 65 },
  { hours: 5, aliceScore: 74, bobScore: 73 },
  { hours: 6, aliceScore: 82, bobScore: 78 },
  { hours: 7, aliceScore: 88, bobScore: 85 },
  { hours: 8, aliceScore: 93, bobScore: 91 },
];

const chart = createChart(container, {
  data: studyData,
  xSerie: { accessor: (d) => d.hours, label: "Study Hours" },
  ySeries: [
    { accessor: (d) => d.aliceScore, label: "Alice", stroke: "steelblue" },
    { accessor: (d) => d.bobScore, label: "Bob", stroke: "tomato" },
  ],
}, { xType: "linear" })
  .withTitle({ title: "Exam Scores vs. Study Time" })
  .withAxes()
  .withGrid()
  .withLegend();

// Later — switch to quiz data with a single call:
chart.update(quizData);
```


> **What `update()` preserves:**
>
> - All `.with*()` features (axes, grid, legend, tooltip, title, etc.)
> - Series visibility state (if you had called `withVisibleSeries`)
> - Theme overrides
> - The chart container and SVG

### Switching with a Button

A common pattern: use buttons or a dropdown to switch datasets at runtime:

```ts
document.getElementById("show-studies")!.addEventListener("click", () => {
  chart.update(studyData);
  chart.withTitle({ title: "Exam Scores vs. Study Time" });
});

document.getElementById("show-quiz")!.addEventListener("click", () => {
  chart.update(quizData);
  chart.withTitle({ title: "Quiz Scores vs. Study Time" });
});
```

---

## Next Steps

- Browse the [API Reference](/api-reference) for full documentation of every option.
- Read the [Architecture](/architecture) page to understand the render pipeline and library design.
- Check out the **Advanced** section for `withCustom` — the escape hatch that gives you raw access to D3 inside the chart.
