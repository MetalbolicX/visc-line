import { extent } from "d3";

import type { ProcessedSeries, SeriesDescriptor } from "@/types/index.mjs";

/**
 * @internal
 * Determines whether a value is a valid, finite number or a Date.
 * Treats null, undefined, NaN, Infinity, and non-date strings as invalid.
 *
 * @param v - Any value to validate.
 * @returns True if v is a usable numeric value or a Date, false otherwise.
 */
export const isValidNumber = (v: unknown): boolean =>
  v !== null &&
  v !== undefined &&
  (v instanceof Date
    ? !Number.isNaN(v.getTime())
    : !Number.isNaN(Number(v)) && Number.isFinite(Number(v)));

/**
 * Filters an array of data items, keeping only those where both the x and y values
 * (obtained via the provided accessor functions) are valid numbers or Dates.
 *
 * Uses isValidNumber to validate each accessed value. Date objects are accepted
 * for x-axis values (time scales); numeric values are accepted for both axes.
 *
 * @template T
 * @param rawData - Array of raw data items to filter.
 * @param xAccessor - Function that returns the x value for an item (number or Date).
 * @param yAccessor - Function that returns the y value for an item (must be number).
 * @returns Array of data items for which both xAccessor(item) and yAccessor(item) are valid.
 */
export const processNumericData = <T,>(
  rawData: readonly T[],
  xAccessor: (d: T) => unknown,
  yAccessor: (d: T) => unknown,
): readonly T[] =>
  rawData.filter(
    (d) => isValidNumber(xAccessor(d)) && isValidNumber(yAccessor(d)),
  );

/**
 * Filters an array of data items, keeping only those where the x value
 * (obtained via the provided accessor) is a valid number or Date.
 * Unlike `processNumericData`, y validity is NOT checked — this preserves
 * gap rows so that `line.defined()` can break the path rather than silently bridging.
 *
 * @template T
 * @param rawData - Array of raw data items to filter.
 * @param xAccessor - Function that returns the x value for an item (number or Date).
 * @param _yAccessor - Not used; kept for API symmetry with processNumericData.
 * @returns Array of data items for which xAccessor(item) is valid.
 */
export const processNumericDataXOnly = <T,>(
  rawData: readonly T[],
  xAccessor: (d: T) => unknown,
  _yAccessor: (d: T) => unknown,
): readonly T[] => {
   
  const isXValid = (v: unknown): boolean =>
    v !== null &&
    v !== undefined &&
    (v instanceof Date
      ? !Number.isNaN(v.getTime())
      : !Number.isNaN(Number(v)) && Number.isFinite(Number(v)));
  return rawData.filter((d) => isXValid(xAccessor(d)));
};

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
export const processAllSeries = <T,>(
  rawData: readonly T[],
  xAccessor: (d: T) => unknown,
  ySeries: readonly SeriesDescriptor<T>[],
  gapPolicy: "break" | "bridge" = "bridge",
): readonly ProcessedSeries<T>[] =>
  ySeries.map((serie) => ({
    ...serie,
    data: gapPolicy === "break"
      ? processNumericDataXOnly(rawData, xAccessor, serie.accessor)
      : processNumericData(rawData, xAccessor, serie.accessor),
  }));

/**
 * Identity-keyed cache for multi-series extent results.
 *
 * Keyed by the series-array reference itself (WeakMap), so replacing the array
 * (as `createChart.update()` does) naturally produces a new cache entry.
 * No cross-instance pollution is possible because each distinct array reference
 * is its own key.
 *
 * Note: in-place mutation of the array does NOT invalidate the cache — callers
 * must replace the array to get fresh extents.
 */
const extentCache = new WeakMap<
  readonly unknown[],
  Readonly<{
    readonly xDomain: readonly [undefined, undefined] | readonly [unknown, unknown];
    readonly yDomain: readonly [number, number] | readonly [undefined, undefined];
  }>
>();

/**
 * Compute combined x and y extents for multiple processed series.
 *
 * - xDomain: Extent across all series' x values using the provided xAccessor.
 * - yDomain: Extent across all series' y values using each series' `accessor`.
 *
 * Results are memoized in a WeakMap keyed by the series-array reference.
 * Replacing the array (as `createChart.update()` does) naturally produces a
 * new cache entry. In-place mutation of the array does NOT invalidate the
 * cache — callers must replace the array to get fresh extents.
 *
 * Important notes:
 * - Either domain may be [undefined, undefined] when no valid numeric values
 *   are present.
 * - Prefer passing an xAccessor that returns numbers; the value is coerced to
 *   number when passed to d3.extent.
 *
 * @template T - Datum type contained in each series' data array.
 * @param processedSeries - Array of processed series, each with `label`,
 *   `accessor`, and a `data` array of T.
 * @param xAccessor - Function extracting the x value from a datum.
 * @returns Object with `xDomain` and `yDomain` two-element extents.
 * @example
 * ```ts
 * const { xDomain, yDomain } = getMultiSeriesExtents(series, d => d.x);
 * ```
 */
export const getMultiSeriesExtents = <T,>(
  processedSeries: readonly ProcessedSeries<T>[],
  xAccessor: (d: T) => unknown,
): Readonly<{
  readonly xDomain: readonly [undefined, undefined] | readonly [unknown, unknown];
  readonly yDomain: readonly [number, number] | readonly [undefined, undefined];
}> => {
  const cached = extentCache.get(processedSeries);
  if (cached) return cached;

  const result = {
    xDomain: extent(
      processedSeries.flatMap(({ data }) => data),
      xAccessor as (d: T) => number,
    ) as readonly [undefined, undefined] | readonly [unknown, unknown],
    yDomain: extent(
      processedSeries.flatMap(({ accessor, data }) => data.map(accessor)),
    ),
  };

  extentCache.set(processedSeries, result);
  return result;
};

/**
 * Clears the extent cache. No longer required for cache invalidation — the
 * WeakMap is keyed by array identity, so replacing the series array (as
 * `createChart.update()` does) automatically produces a new cache entry.
 *
 * @deprecated Cache invalidation is now automatic via array-identity WeakMap.
 *   Callers should replace the array to trigger recomputation instead of calling
 *   this function.
 */
export const clearExtentCache = (): void => {
  // No-op: the WeakMap is keyed by array identity; replacing the array
  // (as createChart.update() does) naturally produces a new cache key.
};
