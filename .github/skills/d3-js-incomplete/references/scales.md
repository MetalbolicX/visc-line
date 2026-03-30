# Scales D3.js Reference

## Overview

Scales are functions that map from a data domain to a visual range. They are fundamental for encoding data values into visual properties like position, length, color, and size. D3 provides a variety of scale types for different data types and visual encodings.

## Types of Scales

### Quantitative Scales

#### Linear Scale

Maps continuous numeric input to continuous output. Ideal for linear interpolation.

```javascript
const scale = d3.scaleLinear().domain([0, 100]).range([0, 500]);

scale(50); // returns 250
scale(75); // returns 375
scale(100); // returns 500

// Invert the scale
scale.invert(250); // returns 50
```

Use cases:

- Most common scale for quantitative data.
- Suitable for bar charts, line charts, scatter plots, etc.
- Good for many physical measurements (length, weight, temperature) that have a linear relationship.

#### Logarithmic Scale

Maps continuous numeric input to continuous output on a logarithmic scale. Useful for data with exponential growth.

```javascript
const logScale = d3.scaleLog().domain([1, 1000]).range([0, 500]);

logScale(10); // returns 166.666...
logScale(100); // returns 333.333...
logScale(1000); // returns 500
```

Use cases:

- Data spanning several orders of magnitude (e.g., population, financial data).
- When you want to emphasize relative differences rather than absolute differences.
- Handles exponential growth patterns (e.g., viral growth, compound interest).

**Note**: Log scales cannot handle zero or negative values. Consider using a symlog scale if your data includes such values.

#### Power Scale

Maps continuous numeric input to continuous output using a power function. Useful for data with polynomial relationships.

```javascript
const squareScale = d3.scalePow().exponent(2).domain([0, 100]).range([0, 20]);
const sqrtScale = d3.scaleSqrt().domain([0, 100]).range([0, 10]);
```

Use cases:

- Data with polynomial relationships (e.g., area, volume).
- When you want to emphasize larger values more than smaller ones (e.g., bubble charts).

#### Time Scale

Maps date/time input to continuous output. Ideal for temporal data.

```javascript
const timeScale = d3
  .scaleTime()
  .domain([new Date(2020, 0, 1), new Date(2020, 11, 31)])
  .range([0, 1000]);

timeScale(new Date(2020, 5, 1)); // returns 500

// Invert the scale
timeScale.invert(500); // returns new Date(2020, 5, 1)
```

Use cases:

- Temporal data (e.g., time series, timelines).
- Date based insights (e.g., events, milestones).
- Temporal animations (e.g., transitions over time) where accurate time mapping is crucial.

#### Quantize Scale

Maps continuous numeric input to discrete output based on quantiles. Useful for categorizing continuous data.

```javascript
const quantizeScale = d3
  .scaleQuantize()
  .domain([0, 100])
  .range(["low", "medium", "high"]);

quantizeScale(25); // returns "low"
quantizeScale(50); // returns "medium"
quantizeScale(75); // returns "high"
quantizeScale.quantiles(); // returns [33.333..., 66.666...] (thresholds for quantization)
```

Use cases:

- Equaal-size groups regardless of data distribution (e.g., quartiles, quintiles).
- Percentile-based categorization (e.g., top 10%, bottom 25%).
- Handles skewed data distributions by creating categories that reflect the data distribution rather than fixed intervals.

#### Threshold Scale

Maps continuous numeric input to discrete output based on specified thresholds. Useful for categorizing data based on custom thresholds.

```javascript
const thresholdScale = d3
  .scaleThreshold()
  .domain([30, 70])
  .range(["low", "medium", "high"]);

thresholdScale(25); // returns "low"
thresholdScale(50); // returns "medium"
thresholdScale(75); // returns "high"
```

Use cases:

- Custom categorization based on specific thresholds (e.g., pass/fail, risk levels).
- When you have specific cutoff points that are meaningful for your data (e.g., age groups, income brackets).
- When you want to create categories that do not necessarily reflect equal sizes or quantiles but are based on domain-specific knowledge or requirements.

### Sequential Scales

#### Sequential Scale

Maps continuous numeric input to a continuous output range, typically for color encoding. Useful for representing data intensity.

```javascript
const sequentialScale = d3
  .scaleSequential()
  .domain([0, 100])
  .interpolator(d3.interpolateViridis);

sequentialScale(50); // returns the color corresponding to the midpoint of the Viridis scale
```

Use cases:

- Data intensity or magnitude (e.g., heat maps, choropleth maps).
- When you want to represent a continuous range of values with a gradient of colors.
- Heat maps. choropleth maps.

#### Diverging Scale

Maps continuous numeric input to a diverging output range, typically for color encoding. Useful for representing data that diverges from a central point.

```javascript
const divergingScale = d3
  .scaleDiverging()
  .domain([0, 50, 100])
  .interpolator(d3.interpolateRdBu);

divergingScale(25); // returns the color corresponding to the midpoint between 0 and 50 on the RdBu scale
divergingScale(75); // returns the color corresponding to the midpoint between 50 and 100 on the RdBu scale
```

Use cases:

- Data that diverges from a central point (e.g., temperature anomalies, sentiment analysis).
- When you want to represent both positive and negative deviations from a central value with distinct colors.
- When you want to emphasize the difference between values above and below a critical threshold (e.g., zero, average).

#### Sequential Quantile Scale

Maps continuous numeric input to a continuous output range based on quantiles. Useful for representing data intensity while accounting for data distribution.

```javascript
const sequentialQuantileScale = d3
  .scaleSequentialQuantile()
  .domain([0, 100])
  .interpolator(d3.interpolateViridis);

sequentialQuantileScale(25); // returns the color corresponding to the 25th percentile of the data distribution on the Viridis scale
sequentialQuantileScale(75); // returns the color corresponding to the 75th percentile of the data distribution on the Viridis scale
```

Use cases:

- Data intensity or magnitude while accounting for data distribution (e.g., heat maps, choropleth maps).
- When you want to represent a continuous range of values with a gradient of colors while ensuring that the color mapping reflects the distribution of the data rather than fixed intervals.
- When you have skewed data distributions and want to ensure that the color encoding provides meaningful distinctions across the range of values (e.g., income distribution, population density).

### Ordinal Scales

#### Band Scale

Maps discrete input to continuous bands with optional padding.

```javascript
const bandScale = d3
  .scaleBand()
  .domain(["A", "B", "C", "D"])
  .range([0, 500])
  .padding(0.1);

bandScale("B"); // returns 125 (start of band for 'B')
bandScale.bandwidth(); // returns 100 (width of each band)
bandScale.step(); // returns 125 (distance from start of one band to the next)
bandScale.paddingInner(); // returns 0.1 (inner padding between bands)
bandScale.paddingOuter(); // returns 0.1 (outer padding on the ends)
```

Use cases:

- Categorical data (e.g., product categories, regions).
- Bar charts, grouped bar charts, and stacked bar charts.
- Heat maps where each cell represents a category.

#### Point Scale

Maps discrete input to continuous points (no width).

```javascript
const pointScale = d3
  .scalePoint()
  .domain(["A", "B", "C", "D"])
  .range([0, 500])
  .padding(0.5);

pointScale("B"); // returns 250 (position of 'B')
pointScale.step(); // returns 166.666... (distance between points)
```

Use cases:

- Linear chart with categorical x-axis (e.g., line charts with discrete categories).
- When you want to position elements at specific points rather than bands (e.g., scatter plots with categorical axes).
- Node positions in network diagrams where nodes are discrete but need to be spaced evenly.
- Any point visualization where you want to avoid the visual weight of bands (e.g., dot plots, lollipop charts).

#### Ordinal Scale

Maps discrete input to discrete output (e.g., colors, shapes).

```javascript
const ordinalScale = d3
  .scaleOrdinal()
  .domain(["A", "B", "C", "D"])
  .range(d3.schemeCategory10);

ordinalScale("B"); // returns the color assigned to 'B'

// Custom range
const customOrdinalScale = d3
  .scaleOrdinal()
  .domain(["A", "B", "C", "D"])
  .range(["red", "green", "blue", "orange"]);

customOrdinalScale("C"); // returns "blue"
```

Use cases:

- Categorical data (e.g., product categories, regions).
- Assigning colors, shapes, or other discrete visual properties to categories.
- Legends and categorical encodings in charts.
- When you want to ensure consistent mapping of categories to visual properties across multiple charts or visualizations.

## Common Patterns for Using D3.js

### Diverging scale with custom midpoint

```javascript
const divergingScale = d3
  .scaleLinear()
  .domain(["min", "mid", "max"])
  .range(["blue", "white", "red"])
  .interpolator(d3.interpolateRdBu);
```

### Multi-stop gradient scale

```javascript
const multiStopScale = d3
  .scaleLinear()
  .domain([0, 25, 50, 75, 100])
  .range(["blue", "cyan", "green", "yellow", "red"]);
```

#### Radial scale for circular layouts

```javascript
const radialScale = d3
  .scaleLinear()
  .domain([0, 100])
  .range([0, 2 * Math.PI]);

circle.attr("r", ({ value }) => radialScale(value));
```

#### Color scale with explicit categories

```javascript
const colorScale = d3
  .scaleOrdinal()
  .domain(["A", "B", "C", "D"])
  .range(["red", "green", "blue", "orange"]);
```

#### Adaptive scales based on data distribution

```javascript
const createAdaptiveScale = (data) => {
  const extent = d3.extent(data, ({ value }) => value);
  const [minValue, maxValue] = extent;
  const range = maxValue - minValue;

  if (maxValue / minValue > 100) {
    return d3.scaleLog().domain(extent).range([0, 500]);
  }
  return d3.scaleLinear().domain(extent).range([0, 500]);
};
```
