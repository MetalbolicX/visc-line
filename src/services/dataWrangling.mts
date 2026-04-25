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
const isValidNumber = (v: unknown): boolean =>
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
): readonly ProcessedSeries<T>[] =>
  ySeries.map((serie) => ({
    ...serie,
    data: processNumericData(rawData, xAccessor, serie.accessor),
  }));

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
  Readonly<{
    readonly xDomain: readonly [undefined, undefined] | readonly [unknown, unknown];
    readonly yDomain: readonly [number, number] | readonly [undefined, undefined];
  }>
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
const extentCacheKey = <T,>(processedSeries: readonly ProcessedSeries<T>[]): string =>
  processedSeries
    .map(
      (s) => `${encodeURIComponent(s.label)}:${String(s.data.length)}`,
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
  processedSeries: readonly ProcessedSeries<T>[],
  xAccessor: (d: T) => unknown,
): Readonly<{
  readonly xDomain: readonly [undefined, undefined] | readonly [unknown, unknown];
  readonly yDomain: readonly [number, number] | readonly [undefined, undefined];
}> => {
  const cacheKey = extentCacheKey(processedSeries);
  const cached = extentCache.get(cacheKey);
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

  extentCache.set(cacheKey, result);
  return result;
};

/**
 * Clears the module-level extent cache.
 *
 * Call this before recomputing extents with new data to avoid returning
 * stale cached values when data arrays have the same length but different content.
 *
 * @example
 * ```ts
 * clearExtentCache();
 * const { xDomain, yDomain } = getMultiSeriesExtents(newSeries, accessor);
 * ```
 */
export const clearExtentCache = (): void => {
  extentCache.clear();
};
