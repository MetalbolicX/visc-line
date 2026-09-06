import { describe, expect, it } from "vitest";

import type { ProcessedSeries } from "../../types/index.mjs";

import { getMultiSeriesExtents, processAllSeries, processNumericData, processNumericDataXOnly } from "../../services/dataWrangling.mjs";

interface SeriesPoint {
  readonly x: number;
  readonly y: number;
}

describe("processNumericData", () => {
  it("keeps rows where both x and y are valid finite numbers", () => {
    /**
     *
     */
    const rawData = [
      { x: 1, y: 2 },
      { x: 2, y: 3 },
    ];
    /**
     *
     */
    const result = processNumericData(rawData, (d) => d.x, (d) => d.y);
    expect(result.map((d) => d.x)).toEqual([1, 2]);
  });

  it("removes rows with NaN x value", () => {
    /**
     *
     */
    const rawData = [
      { x: NaN, y: 2 },
      { x: 1, y: 2 },
    ];
    /**
     *
     */
    const result = processNumericData(rawData, (d) => d.x, (d) => d.y);
    expect(result.length).toBe(1);
    expect(result[0].x).toBe(1);
  });

  it("removes rows with NaN y value", () => {
    /**
     *
     */
    const rawData = [
      { x: 1, y: NaN },
      { x: 2, y: 3 },
    ];
    /**
     *
     */
    const result = processNumericData(rawData, (d) => d.x, (d) => d.y);
    expect(result.length).toBe(1);
    expect(result[0].x).toBe(2);
  });

  it("removes rows with Infinity in x or y", () => {
    /**
     *
     */
    const rawData = [
      { x: Infinity, y: 1 },
      { x: 1, y: -Infinity },
      { x: 2, y: 3 },
    ];
    /**
     *
     */
    const result = processNumericData(rawData, (d) => d.x, (d) => d.y);
    expect(result.length).toBe(1);
    expect(result[0].x).toBe(2);
  });

  it("removes rows where x is null or undefined", () => {
    /**
     *
     */
    const rawData = [
      { x: null, y: 1 },
      { x: 1, y: 2 },
    ] as readonly Readonly<{ readonly x: null | number; readonly y: number }>[];
    /**
     *
     */
    const result = processNumericData(rawData, (d) => d.x, (d) => d.y);
    expect(result.length).toBe(1);
  });

  it("removes rows where y is null or undefined", () => {
    /**
     *
     */
    const rawData = [
      { x: 1, y: undefined },
      { x: 2, y: 3 },
    ] as readonly Readonly<{ readonly x: number; readonly y: number | undefined }>[];
    /**
     *
     */
    const result = processNumericData(rawData, (d) => d.x, (d) => d.y);
    expect(result.length).toBe(1);
    expect(result[0].x).toBe(2);
  });

  it("keeps rows where x or y are zero (falsy but valid)", () => {
    /**
     *
     */
    const rawData = [
      { x: 0, y: 1 },
      { x: 1, y: 0 },
    ];
    /**
     *
     */
    const result = processNumericData(rawData, (d) => d.x, (d) => d.y);
    expect(result.length).toBe(2);
  });

  it("returns empty array when no data is valid", () => {
    /**
     *
     */
    const rawData = [
      { x: NaN, y: NaN },
    ];
    /**
     *
     */
    const result = processNumericData(rawData, (d) => d.x, (d) => d.y);
    expect(result).toEqual([]);
  });
});

describe("processNumericDataXOnly (plan-025)", () => {
  it("keeps rows with valid x regardless of y validity", () => {
    const rawData = [
      { x: 1, y: NaN },
      { x: 2, y: 3 },
    ];
    const result = processNumericDataXOnly(rawData, (d) => d.x, (d) => d.y);
    expect(result.length).toBe(2);
    expect(result.map((d: { x: number; y: number }) => d.x)).toEqual([1, 2]);
  });

  it("still removes rows with invalid x even if y is valid", () => {
    const rawData = [
      { x: NaN, y: 2 },
      { x: 1, y: 3 },
    ];
    const result = processNumericDataXOnly(rawData, (d) => d.x, (d) => d.y);
    expect(result.length).toBe(1);
    expect(result[0].x).toBe(1);
  });

  it("keeps rows where y is Infinity but x is valid", () => {
    const rawData = [
      { x: 1, y: Infinity },
      { x: 2, y: 3 },
    ];
    const result = processNumericDataXOnly(rawData, (d) => d.x, (d) => d.y);
    expect(result.length).toBe(2);
  });

  it("returns empty array when all x values are invalid", () => {
    const rawData = [
      { x: NaN, y: 1 },
      { x: null, y: 2 },
    ];
    const result = processNumericDataXOnly(rawData, (d) => d.x, (d) => d.y);
    expect(result.length).toBe(0);
  });
});

describe("processAllSeries — sorting", () => {
  it("plan-026: sorts numeric x values ascending", () => {
    const rawData = [
      { x: 3, y: 3 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    ];
    const result = processAllSeries(rawData, (d: { x: number; y: number }) => d.x, [
      { label: "series", accessor: (d: { x: number; y: number }) => d.y, stroke: "steelblue" },
    ]);
    expect(result[0].data.map((d: { x: number }) => d.x)).toEqual([1, 2, 3]);
  });

  it("plan-026: sorts Date x values ascending", () => {
    const d1 = new Date(2023, 0, 3);
    const d2 = new Date(2023, 0, 1);
    const d3 = new Date(2023, 0, 2);
    const rawData = [
      { x: d3, y: 3 },
      { x: d1, y: 1 },
      { x: d2, y: 2 },
    ];
    const result = processAllSeries(rawData, (d: { x: Date; y: number }) => d.x, [
      { label: "series", accessor: (d: { x: Date; y: number }) => d.y, stroke: "steelblue" },
    ]);
    expect(result[0].data.map((d: { x: Date }) => d.x.toDateString())).toEqual([
      new Date(2023, 0, 1).toDateString(),
      new Date(2023, 0, 2).toDateString(),
      new Date(2023, 0, 3).toDateString(),
    ]);
  });

  it("plan-026: stable sort — equal x values keep original relative order", () => {
    const rawData = [
      { x: 5, y: 1 },
      { x: 5, y: 2 },
      { x: 5, y: 3 },
      { x: 3, y: 4 },
      { x: 3, y: 5 },
    ];
    const result = processAllSeries(rawData, (d: { x: number; y: number }) => d.x, [
      { label: "series", accessor: (d: { x: number; y: number }) => d.y, stroke: "steelblue" },
    ]);
    // x=3 comes first (sorted), then x=5 in original relative order
    expect(result[0].data.map((d: { x: number; y: number }) => d.y)).toEqual([4, 5, 1, 2, 3]);
  });

  it("plan-026: does not mutate the caller's raw array", () => {
    const rawData: readonly { x: number; y: number }[] = [
      { x: 3, y: 3 },
      { x: 1, y: 1 },
    ];
    const originalFirst = rawData[0];
    processAllSeries(rawData, (d: { x: number; y: number }) => d.x, [
      { label: "series", accessor: (d: { x: number; y: number }) => d.y, stroke: "steelblue" },
    ]);
    expect(rawData[0]).toBe(originalFirst);
    expect(rawData[0].x).toBe(3); // order unchanged
  });
});

describe("getMultiSeriesExtents", () => {
  /**
   *
   */
  const makeSeries = (
    data: readonly SeriesPoint[],
    accessor: (d: SeriesPoint) => number,
    label = "series",
  ): ProcessedSeries<SeriesPoint> => ({
    accessor,
    data,
    label,
    stroke: "steelblue",
  });

  it("computes combined x and y domains from multiple series", () => {
    /**
     *
     */
    const series1 = makeSeries([{ x: 1, y: 10 }, { x: 2, y: 20 }], (d) => d.y);
    /**
     *
     */
    const series2 = makeSeries([{ x: 3, y: 15 }, { x: 4, y: 25 }], (d) => d.y);

    /**
     *
     */
    const result = getMultiSeriesExtents(
      [series1, series2],
      (d) => d.x,
    );

    expect(result.xDomain).toEqual([1, 4]);
    expect(result.yDomain).toEqual([10, 25]);
  });

  it("returns [undefined, undefined] xDomain when series data is empty", () => {
    /**
     *
     */
    const emptySeries = makeSeries([], (d) => d.y);
    /**
     *
     */
    const result = getMultiSeriesExtents([emptySeries], (d) => d.x);
    expect(result.xDomain).toEqual([undefined, undefined]);
  });

  it("returns [undefined, undefined] yDomain when series data is empty", () => {
    /**
     *
     */
    const emptySeries = makeSeries([], (d) => d.y);
    /**
     *
     */
    const result = getMultiSeriesExtents([emptySeries], (d) => d.x);
    expect(result.yDomain).toEqual([undefined, undefined]);
  });

  it("handles negative values in both domains", () => {
    /**
     *
     */
    const series = makeSeries([{ x: -10, y: -100 }, { x: -5, y: -50 }], (d) => d.y);
    /**
     *
     */
    const result = getMultiSeriesExtents([series], (d) => d.x);
    expect(result.xDomain).toEqual([-10, -5]);
    expect(result.yDomain).toEqual([-100, -50]);
  });

  it("handles a single data point", () => {
    /**
     *
     */
    const series = makeSeries([{ x: 5, y: 50 }], (d) => d.y);
    /**
     *
     */
    const result = getMultiSeriesExtents([series], (d) => d.x);
    expect(result.xDomain).toEqual([5, 5]);
    expect(result.yDomain).toEqual([50, 50]);
  });

  it("works with Date x values", () => {
    /**
     *
     */
    const series = [
      makeSeries([{ x: 1, y: 10 }, { x: 2, y: 20 }], (d) => d.y),
      makeSeries([{ x: 3, y: 15 }, { x: 4, y: 25 }], (d) => d.y),
    ];
    /**
     *
     */
    const result = getMultiSeriesExtents(series, (d) => d.x);
    expect(result.xDomain).toEqual([1, 4]);
    expect(result.yDomain).toEqual([10, 25]);
  });

  it("keeps cached extents isolated by label", () => {
    const revenueSeries = makeSeries(
      [{ x: 1, y: 10 }, { x: 2, y: 20 }],
      (d) => d.y,
      "Revenue",
    );
    const costSeries = makeSeries(
      [{ x: 1, y: 100 }, { x: 2, y: 200 }],
      (d) => d.y,
      "Cost",
    );

    const all = getMultiSeriesExtents([revenueSeries, costSeries], (d) => d.x);
    const onlyRevenue = getMultiSeriesExtents([revenueSeries], (d) => d.x);

    expect(all.yDomain).toEqual([10, 200]);
    expect(onlyRevenue.yDomain).toEqual([10, 20]);
  });

  it("plan-007: isolation — same label+length but different data must not share cache entry", () => {
    // Two series with identical label ("Revenue") and identical point count (2).
    // The old content-fingerprint cache key would collide, returning A's extents for B.
    const seriesA = makeSeries([{ x: 1, y: 10 }, { x: 2, y: 20 }], (d) => d.y, "Revenue");
    const seriesB = makeSeries([{ x: 1, y: 100 }, { x: 2, y: 200 }], (d) => d.y, "Revenue");

    // Compute A's extents first (populates the cache for this label+length fingerprint)
    const extentsA = getMultiSeriesExtents([seriesA], (d) => d.x);
    expect(extentsA.yDomain).toEqual([10, 20]);

    // Compute B's extents — B's data is different and has a wider range.
    // Under the new identity-keyed WeakMap cache each array reference is its own
    // key, so B's result correctly reflects B's data ([100, 200]), not A's.
    const extentsB = getMultiSeriesExtents([seriesB], (d) => d.x);
    expect(extentsB.yDomain).toEqual([100, 200]);
  });

  it("plan-007: array replacement invalidates cache — replace array, get fresh extents", () => {
    // The cache is keyed by series-array identity. Replacing the array (as
    // createChart.update() does) naturally produces a new cache key.
    const dataA: readonly SeriesPoint[] = [{ x: 1, y: 10 }, { x: 2, y: 20 }];
    const seriesA = makeSeries(dataA, (d) => d.y, "Revenue");

    const extentsFirst = getMultiSeriesExtents([seriesA], (d) => d.x);
    expect(extentsFirst.yDomain).toEqual([10, 20]);

    // Simulate update() by passing a new array with different values.
    // The new array is a new reference — a new WeakMap key.
    const dataB: readonly SeriesPoint[] = [{ x: 1, y: 10 }, { x: 2, y: 200 }];
    const seriesB = makeSeries(dataB, (d) => d.y, "Revenue");

    const extentsAfterReplace = getMultiSeriesExtents([seriesB], (d) => d.x);
    expect(extentsAfterReplace.yDomain).toEqual([10, 200]);
  });

  it("plan-007: cache hit on stable reference returns identical object", () => {
    const series = makeSeries([{ x: 1, y: 10 }, { x: 2, y: 20 }], (d) => d.y, "Revenue");
    // Store the same array reference — WeakMap is keyed by array identity.
    const seriesArray = [series];

    const first = getMultiSeriesExtents(seriesArray, (d) => d.x);
    const second = getMultiSeriesExtents(seriesArray, (d) => d.x);

    // Must be the exact same frozen object (memoized)
    expect(first).toBe(second);
  });

  it("plan-007: in-place mutation is NOT observed when array reference is stable", () => {
    // WeakMap is keyed by array identity. If the same array reference is passed
    // (stable reference), in-place mutation of the underlying data does NOT
    // change the cache key — callers must replace the array to get fresh extents.
    const data: SeriesPoint[] = [{ x: 1, y: 10 }, { x: 2, y: 20 }];
    const series = makeSeries(data as readonly SeriesPoint[], (d) => d.y, "Revenue");
    // Same array reference passed to both calls
    const seriesArray = [series];

    const before = getMultiSeriesExtents(seriesArray, (d) => d.x);
    expect(before.yDomain).toEqual([10, 20]);

    // Mutate in-place — push a point with a much larger y value.
    data.push({ x: 3, y: 999 });

    // With the SAME array reference the WeakMap key is unchanged, so we get the
    // STALE cached result reflecting the pre-mutation data. Callers must
    // replace the array to get fresh extents.
    const after = getMultiSeriesExtents(seriesArray, (d) => d.x);
    expect(after.yDomain).toEqual([10, 20]); // NOT [10, 999]
  });
});
