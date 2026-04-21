import { extent } from "d3";

import type { ProcessedSeries, SeriesDescriptor } from "@/types/index.mjs";

/**
 * @internal
 * Determines whether a value is a valid, finite number.
 * Treats null, undefined, NaN, and Infinity as invalid.
 *
 * @param v - Any value to validate.
 * @returns True if v is a usable numeric value, false otherwise.
 */
const isValidNumber = (v: unknown): boolean =>
  v !== null &&
  v !== undefined &&
  !Number.isNaN(Number(v)) &&
  Number.isFinite(Number(v));

/**
 * Filters an array of data items, keeping only those where both the x and y values
 * (obtained via the provided accessor functions) are valid numbers.
 *
 * Uses isValidNumber to validate each accessed value.
 *
 * @template T
 * @param rawData - Array of raw data items to filter.
 * @param xAccessor - Function that returns the x value for an item.
 * @param yAccessor - Function that returns the y value for an item.
 * @returns Array of data items for which both xAccessor(item) and yAccessor(item) are valid numbers.
 */
export /**
        *
        */
const processNumericData = <T,>(
  rawData: T[],
  xAccessor: (d: T) => unknown,
  yAccessor: (d: T) => unknown,
): T[] =>
  rawData.filter(
    (d) => isValidNumber(xAccessor(d)) && isValidNumber(yAccessor(d)),
  );

/**
 * Processes all series descriptors by computing numeric data for each series.
 *
 * For each entry in ySeries this returns a new descriptor object that preserves
 * the original properties and adds a `data` property produced by
 * `processNumericData(rawData, xAccessor, serie.accessor)`.
 *
 * @param rawData - The raw dataset (array of records) to be processed.
 * @param xAccessor - A function that, given a datum, returns the x value.
 * @param ySeries - Array of series descriptors.
 * @returns New array of series descriptors where each descriptor includes a `data` array.
 */
export /**
        *
        */
const processAllSeries = <T,>(
  rawData: T[],
  xAccessor: (d: T) => unknown,
  ySeries: SeriesDescriptor<T>[],
): ProcessedSeries<T>[] =>
  ySeries.map((serie) => ({
    ...serie,
    data: processNumericData(rawData, xAccessor, serie.accessor),
  }));

/**
 * Compute combined x and y extents for multiple series.
 *
 * @param processedSeries - Array of series objects with `data` and `accessor`.
 * @param xAccessor - Function that extracts the x value from a datum.
 * @returns An object with xDomain and yDomain two-element extent arrays.
 */
export /**
        *
        */
const getMultiSeriesExtents = <T,>(
  processedSeries: ProcessedSeries<T>[],
  xAccessor: (d: T) => unknown,
): {
  xDomain: [undefined, undefined] | [unknown, unknown];
  yDomain: [number, number] | [undefined, undefined];
} => ({
  xDomain: extent(
    processedSeries.flatMap(({ data }) => data),
    xAccessor as (d: T) => number,
  ) as [undefined, undefined] | [unknown, unknown],
  yDomain: extent(
    processedSeries.flatMap(({ accessor, data }) =>
      data.map(accessor),
    ),
  ),
});