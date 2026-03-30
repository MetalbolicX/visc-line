"use strict";
import { extent } from "d3";

/**
 * Check whether a value represents a valid finite number.
 *
 * The value is coerced via Number(...) and is considered valid if it is
 * neither null nor undefined, not NaN, and is finite after coercion.
 *
 * @param {*} v - The value to test (may be a number, numeric string, etc.).
 * @returns {boolean} True if the coerced value is a finite number; otherwise false.
 */
const isValidNumber = (v) =>
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
 * @param {T[]} rawData - Array of raw data items to filter.
 * @param {(d: T) => unknown} xAccessor - Function that returns the x value for an item.
 * @param {(d: T) => unknown} yAccessor - Function that returns the y value for an item.
 * @returns {T[]} Array of data items for which both xAccessor(item) and yAccessor(item) are valid numbers.
 */
export const processNumericData = (rawData, xAccessor, yAccessor) =>
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
 * @param {Array<*>} rawData - The raw dataset (array of records) to be processed.
 * @param {Function} xAccessor - A function that, given a datum, returns the x value.
 * @param {Array<Object>} ySeries - Array of series descriptors. Each descriptor
 *   must include an `accessor` used to extract the y value from a datum.
 * @returns {Array<Object>} New array of series descriptors where each descriptor
 *   includes a `data` array with the processed numeric points for that series.
 */
export const processAllSeries = (rawData, xAccessor, ySeries) =>
  ySeries.map((serie) => ({
    ...serie,
    data: processNumericData(rawData, xAccessor, serie.accessor),
  }));

/**
 * Compute combined x and y extents for multiple series.
 *
 * @param {Array<{data: Array<any>, accessor: (d: any) => any}>} processedSeries - Array of series objects. Each series must have a `data` array and an `accessor` function that extracts the y value from a datum.
 * @param {(d: any) => any} xAccessor - Function that extracts the x value from a datum.
 * @returns {{ xDomain: [any, any] | undefined, yDomain: [any, any] | undefined }} An object with:
 *   - xDomain: two-element array [min, max] for x values as returned by d3.extent (or undefined for empty input)
 *   - yDomain: two-element array [min, max] for y values as returned by d3.extent (or undefined for empty input)
 */
export const getMultiSeriesExtents = (processedSeries, xAccessor) => ({
  xDomain: extent(
    processedSeries.flatMap(({ data }) => data),
    xAccessor,
  ),
  yDomain: extent(
    processedSeries.flatMap(({ data, accessor }) => data.map(accessor)),
  ),
});
