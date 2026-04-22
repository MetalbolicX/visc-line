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
export const processNumericData = <T,>(
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
export const processAllSeries = <T,>(
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
/**
 * In-memory cache for multi-series extents keyed by `extentCacheKey`.
 *
 * Key construction is deterministic for a given array order and relies on
 * series labels and data lengths. The cached value is a plain object
 * containing `xDomain` and `yDomain` extents. This cache is a module-level
 * mutable Map and therefore a side-effect of calling getMultiSeriesExtents.
 *
 * PERF: Avoid mutating series labels or their `data` arrays after computing
 * extents, otherwise the cache may become stale or collide.
 */
const extentCache = new Map<
  string,
  {
    xDomain: [undefined, undefined] | [unknown, unknown];
    yDomain: [number, number] | [undefined, undefined];
  }
>();

/**
 * Create a stable cache key for a collection of processed series.
 *
 * The key is formed from each series' label and the number of points in its
 * `data` array. Labels are URI-encoded to avoid accidental separator
 * collisions (labels containing ':' or '|' would otherwise corrupt the key).
 *
 * Notes:
 * - The function is deterministic for the same array contents and order.
 * - If two different label/length combinations produce the same encoded
 *   string (extremely unlikely) the cache may collide; callers should avoid
 *   mutating labels or reusing labels across distinct series when caching is
 *   important. (PERF)
 *
 * @template T - Datum type for the series data arrays.
 * @param processedSeries - Array of processed series to derive the key from.
 * @returns A simple string key safe to use as a Map key for caching extents.
 */
const extentCacheKey = <T,>(processedSeries: ProcessedSeries<T>[]): string =>
  processedSeries
    .map(
      (s) => `${encodeURIComponent(String(s.label))}:${String(s.data.length)}`,
    )
    .join("|");

/**
 * Compute combined x and y extents for multiple processed series.
 *
 * - xDomain: Extent across all series' x values using the provided xAccessor.
 * - yDomain: Extent across all series' y values using each series' `accessor`.
 *
 * Side effects:
 * - Results are memoized in a module-level cache keyed by series label and
 *   data length. The cache is invalidated implicitly when callers change the
 *   labels or the number of data points (caller must ensure stable labels).
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
  processedSeries: ProcessedSeries<T>[],
  xAccessor: (d: T) => unknown,
): {
  xDomain: [undefined, undefined] | [unknown, unknown];
  yDomain: [number, number] | [undefined, undefined];
} => {
  const cacheKey = extentCacheKey(processedSeries);
  const cached = extentCache.get(cacheKey);
  if (cached) return cached;

  const result = {
    xDomain: extent(
      processedSeries.flatMap(({ data }) => data),
      xAccessor as (d: T) => number,
    ) as [undefined, undefined] | [unknown, unknown],
    yDomain: extent(
      processedSeries.flatMap(({ accessor, data }) => data.map(accessor)),
    ) as [number, number] | [undefined, undefined],
  };

  extentCache.set(cacheKey, result);
  return result;
};
