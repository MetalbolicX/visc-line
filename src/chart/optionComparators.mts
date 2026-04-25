import type {
  WithLegendOptions,
  WithTitleOptions,
  WithTooltipOptions,
  WithZoomPanOptions,
} from "@/chart/chartTypes.mjs";

/**
 * Compare title options for shallow equality.
 *
 * Compares the `title` property of the previous and next title option objects
 * using strict equality (===). `previous` may be `null` to indicate the
 * absence of prior options. The function returns `true` only when both
 * titles are strictly equal (including when both are `undefined`).
 *
 * @param previous - Previous title options or `null` when none exist.
 * @param next - Next title options to compare against.
 * @returns `true` if the title values are strictly equal, otherwise `false`.
 *
 * @example
 * ```ts
 * areTitleOptionsEqual({ title: 'Chart' }, { title: 'Chart' }) // true
 * ```
 * @internal
 */
export const areTitleOptionsEqual = (
  previous: null | WithTitleOptions,
  next: WithTitleOptions,
): boolean => previous?.title === next.title;

/**
 * Compare legend options for shallow equality.
 *
 * Returns `true` when `previous` is non-null and both legend option sets have the
 * same number of items and every corresponding item has identical `color` and
 * `label` values (checked with strict equality). This is an intentionally shallow
 * comparison used to determine whether legend rendering needs to be updated.
 *
 * Note: `previous` may be `null` to indicate the absence of prior options; in
 * that case the function returns `false` to signal a change.
 *
 * @param previous - Previous legend options or `null` when none exist.
 * @param next - Next legend options to compare against.
 * @returns `true` if item counts match and each item's `color` and `label` are
 * strictly equal; otherwise `false`.
 * @example
 * ```ts
 * areLegendOptionsEqual(
 *   { items: [{ label: 'A', color: '#fff' }] },
 *   { items: [{ label: 'A', color: '#fff' }] },
 * ) // true
 * ```
 * @internal
 */
export const areLegendOptionsEqual = (
  previous: null | WithLegendOptions,
  next: WithLegendOptions,
): boolean => {
  if (!previous) return false;
  if (previous.items.length !== next.items.length) return false;

  for (const [index, prevItem] of previous.items.entries()) {
    const nextItem = next.items[index];
    if (!nextItem) return false;
    if (
      prevItem.color !== nextItem.color ||
      prevItem.label !== nextItem.label
    ) {
      return false;
    }
  }

  return true;
};

/**
 * Compare tooltip options for shallow equality.
 *
 * Only the primitive/identity fields that affect rendering are compared:
 * - `formatX` and `formatY` (formatting functions or identifiers)
 * - `stylesheetUrl` (string URL to stylesheet)
 *
 * This performs a strict (===) comparison for each field. Use this when the
 * tooltip rendering should only update when these specific values change.
 * Note that if `formatX`/`formatY` are functions or objects, this is an
 * identity check; consumers that mutate function implementation in-place
 * should provide new function references to trigger updates.
 *
 * @param previous - Previously applied tooltip options.
 * @param next - New tooltip options to compare against.
 * @returns `true` if all compared fields are strictly equal, otherwise `false`.
 * @example
 * ```ts
 * areTooltipOptionsEqual(
 *   { formatX: x => `${x}%`, formatY: y => `$${y}`, stylesheetUrl: '/t.css' },
 *   { formatX: x => `${x}%`, formatY: y => `$${y}`, stylesheetUrl: '/t.css' },
 * ) // true only if the function references are identical
 * ```
 * @internal
 */
export const areTooltipOptionsEqual = (
  previous: WithTooltipOptions,
  next: WithTooltipOptions,
): boolean =>
  previous.formatX === next.formatX &&
  previous.formatY === next.formatY &&
  previous.stylesheetUrl === next.stylesheetUrl;

/**
 * Compare zoom/pan options for shallow equality.
 *
 * Only the `onZoom` callback identity is compared using strict equality (===).
 * This is an intentional, shallow comparison: if the handler function is
 * mutated in-place its identity will not change and this function will
 * return `true`. Consumers should provide a new function reference to
 * signal a change.
 *
 * @param previous - Previously applied zoom/pan options. Must be a
 *   WithZoomPanOptions object (non-null). The function does not mutate this
 *   object.
 * @param next - New zoom/pan options to compare against.
 * @returns `true` when both `onZoom` references are strictly equal,
 *   otherwise `false`.
 * @example
 * ```ts
 * areZoomPanOptionsEqual(
 *   { onZoom: (z) => console.log(z) },
 *   { onZoom: (z) => console.log(z) },
 * ) // true only if the function references are identical
 * ```
 * @internal
 */
export const areZoomPanOptionsEqual = (
  previous: WithZoomPanOptions,
  next: WithZoomPanOptions,
): boolean => previous.onZoom === next.onZoom;
