import { describe, expect, it } from "vitest";

import type { ProcessedSeries } from "../../types/index.mjs";

import { getMultiSeriesExtents, processNumericData } from "../../services/dataWrangling.mjs";

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

describe("getMultiSeriesExtents", () => {
  /**
   *
   */
  const makeSeries = (
    data: readonly Readonly<{ readonly x: number; readonly y: number }>[],
    accessor: (d: Readonly<{ readonly x: number; readonly y: number }>) => number,
  ): ProcessedSeries<Readonly<{ readonly x: number; readonly y: number }>> => ({
    accessor,
    data,
    label: "series",
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
});
