---
name: "d3-js"
description: "Creating interactive data visualisations using d3.js. This skill should be used when creating custom charts, graphs, network diagrams, geographic visualisations, or any complex SVG-based data visualisation that requires fine-grained control over visual elements, transitions, or interactions. Use this for bespoke visualisations beyond standard charting libraries, whether in React, Vue, Svelte, vanilla JavaScript, or any other environment."
---

# Visualization with D3.js

## Overview

This skill provides guidance for creating sophisticated, interactive data visualisations using d3.js. D3.js excels at binding data to DOM elements and applying data-driven transformations to create custom, publication-quality visualisations with precise control over every visual element. The techniques work across any JavaScript environment, including vanilla JavaScript, React, Vue, Svelte, and other frameworks.

## When to use D3.js

- Custom visualisations requiring unique visual encodings or layouts.
- Interactive explorations with complex pan, zoom, or brush behaviours.
- Network/graph visualisations (force-directed layouts, tree diagrams, hierarchies, chord diagrams).
- Geographic visualisations with custom projections.
- Visualisations requiring smooth, choreographed transitions.
- Publication-quality graphics with fine-grained styling control.
- Novel chart types not available in standard libraries.

## When not to use D3.js

- For 3D visualisations, instead use Three.js.
- Huge datasets, instead use canvas or [D3.js + canvas](https://observablehq.com/@dancingfrog/intro-to-d3-canvas).

## Core workflow

### 1. Set up D3.js

- Use D3.js in your project:

```javascript
import { select, selectAll, ... } from 'd3';
```

Or use the CDN version (7.x):

```html
<script src="https://d3js.org/d3.v7.min.js"></script>
```

### 2. Choose the integration pattern

- **Pattern A: Direct DOM manipulation (recommended for most cases)**
  Use D3 to select DOM elements and manipulate them imperatively. This works in any JavaScript environment.
- **Pattern B: Declarative rendering (for frameworks with templating)**
  Use D3 for data calculations (scales, layouts) but render elements via your framework:

```javascript
const getChartElements = (data) => {
  const xScale = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.value)])
    .range([0, 400]);

  return data.map((d, i) => ({
    x: 50,
    y: i * 30,
    width: xScale(d.value),
    height: 25,
  }));
};

// In React: {getChartElements(data).map((d, i) => <rect key={i} {...d} fill="steelblue" />)}
// In Vue: v-for directive over the returned array
// In vanilla JS: Create elements manually from the returned data
```

Use Pattern A for complex visualisations with transitions, interactions, or when leveraging D3's full capabilities. Use Pattern B for simpler visualisations or when your framework prefers declarative rendering.

### 3. Structure the visualization code

#### Golden Rules for every visual

- Use web standards.
- Write idempotent rendering logic.
- Try to use functional patterns for rendering logic.
- Use inline styles for maximal portability.
- Avoid invalid values (data wranggling first).
- Parse dates.

The most common follow structure for a D3.js visualizations is:

1. Define the layout dimensions. A layout consists of:

- Full width of the container (a HTMLElement).
- Full height of the conteiner (a HTMLElement).
- [Margins](https://observablehq.com/@d3/margin-convention).
- Inner width (width of the container minus the horizontal margins).
- Inner height (height of the container minus the vertical margins).

2. Define the svg.
3. Define a main `<g>` tag with margins.
4. Define the domain (lowest, highest numerical values or categories) for the x and y values from the dataset.
5. With the domain, define the [scales](references/scales.md).
6. Define the components of the chart. The most used are:

- x and y axes.
- Series (visual elements).
- A Title for the chart.
- Labels for x and y values.
- For multiple series, define a legend to identify each series.
- Grid lines for x and y values.

7. Add responsiveness.
8. Optional, add intereactivity such as:

- Tooltip.
- Zoom and Pan.
- Buttons or drop down list.

## Common visualisation patterns

- [Numerical and Date line](references/line/line-chart.md)

## Common issues and solutions

**Issue**: Axes not appearing

- Ensure scales have valid domains (check for NaN values)
- Verify axis is appended to correct group
- Check transform translations are correct

**Issue**: Transitions not working

- Call `.transition()` before attribute changes
- Ensure elements have unique keys for proper data binding
- Check that useEffect dependencies include all changing data

**Issue**: Responsive sizing not working

- Use ResizeObserver or window resize listener
- Update dimensions in state to trigger re-render
- Ensure SVG has width/height attributes or viewBox

**Issue**: Performance problems

- Limit number of DOM elements (consider canvas for >1000 items)
- Debounce resize handlers
- Use `.join()` instead of separate enter/update/exit selections
- Avoid unnecessary re-renders by checking dependencies

## Resources

### references/

Contains detailed reference materials:

- `d3-patterns.md` - Comprehensive collection of visualisation patterns and code examples
- `scale-reference.md` - Complete guide to d3 scales with examples
- `colour-schemes.md` - D3 colour schemes and palette recommendations

### assets/

Contains boilerplate templates:

- `chart-template.js` - Starter template for basic chart
- `interactive-template.js` - Template with tooltips, zoom, and interactions
- `sample-data.json` - Example datasets for testing

These templates work with vanilla JavaScript, React, Vue, Svelte, or any other JavaScript environment. Adapt them as needed for your specific framework.

To use these resources, read the relevant files when detailed guidance is needed for specific visualisation types or patterns.
