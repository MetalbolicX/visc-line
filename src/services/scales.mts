import {
  scaleLinear,
  type ScaleLinear,
  scaleLog,
  scalePow,
  scaleTime,
} from "d3";

import type { AnyScale, ScaleType } from "@/types/index.mjs";

/**
 * Factory map for creating D3 scales by logical ScaleType.
 *
 * Each entry is a function that returns a fresh, unconfigured D3 scale instance
 * compatible with our AnyScale wrapper. The optional `exp` parameter is only
 * observed by the `pow` factory (defaulting to 2) and is ignored by others.
 *
 * Supported keys: `linear`, `log`, `pow`, `time`.
 *
 * Note: callers are expected to further configure the returned scale (domain,
 * range, nice, etc.) before use.
 */
const scaleFactories: Record<ScaleType, (exp?: number) => AnyScale> = {
  linear: () => scaleLinear(),
  log: () => scaleLog(),
  pow: (exp = 2) => scalePow().exponent(exp),
  time: () => scaleTime(),
};

/**
 * Pair of configured D3 scales used for chart coordinate transforms.
 *
 * - xScale maps input domain values (numeric or temporal) to [0, innerWidth].
 * - yScale maps numeric domain values to [innerHeight, 0] (inverted Y axis for SVG).
 */
export interface ChartScales {
  readonly xScale: AnyScale;
  readonly yScale: AnyScale;
}

/**
 * Options for createScales.
 *
 * - innerHeight/innerWidth: the drawable area (excluding margins) used to
 *   construct the output ranges for the scales.
 * - xDomain: numeric or temporal domain for the X scale. Use [undefined, undefined]
 *   to defer domain configuration elsewhere.
 * - yDomain: numeric domain for the Y scale. Use [undefined, undefined] to defer.
 * - xExponent/yExponent: exponent used only when the corresponding scale type is
 *   "pow" (defaults to 2). Other scale types ignore this value.
 * - xType/yType: logical scale kind ("linear" | "log" | "pow" | "time").
 */
export interface CreateScalesOptions {
  readonly innerHeight: number;
  readonly innerWidth: number;
  readonly xDomain: readonly [Date, Date] | readonly [number, number] | readonly [undefined, undefined];
  readonly xExponent?: number;
  readonly xType?: ScaleType;
  readonly yDomain: readonly [number, number] | readonly [undefined, undefined];
  readonly yExponent?: number;
  readonly yType?: ScaleType;
}

/**
 * Validates that a numeric domain is suitable for a given scale type.
 * Log and pow scales require strictly positive domains.
 *
 * @param domain - A two-element domain tuple.
 * @param scaleType - The scale type to validate for.
 * @returns True if the domain is valid for the scale type.
 */
const isDomainValidForScale = (
  domain: readonly number[],
  scaleType: ScaleType,
): boolean => {
  if (scaleType !== "log" && scaleType !== "pow") return true;
  const [min, max] = domain.map(Number);
  return isFinite(min) && isFinite(max) && min > 0 && max > 0;
};

/**
 * Guards a domain tuple against undefined or NaN endpoints, substituting a
 * scale-type-appropriate default and logging a warning.
 *
 * @param domain - A two-element domain tuple that may contain undefined or NaN.
 * @param scaleType - The scale type to determine the default domain.
 * @param silent - If true, suppresses the console.warn (used when the caller
 *   has already warned about an invalid domain and does not want duplicate warnings).
 * @returns A finite [number, number] domain.
 */
export const ensureFiniteDomain = (
  domain: readonly [number | undefined, number | undefined],
  scaleType: ScaleType,
  silent = false,
): [number, number] => {
  const [a, b] = domain;
  if (Number.isFinite(a as number) && Number.isFinite(b as number)) {
    return [a as number, b as number];
  }
  if (!silent) {
    console.warn(
      `[visc-line] empty or invalid domain for ${scaleType} scale; using default domain.`,
    );
  }
  if (scaleType === "time") {
    const now = Date.now();
    return [now, now + 24 * 60 * 60 * 1000];
  }
  return [0, 1];
};

/**
 * Create configured X and Y scales for charts.
 *
 * This factory returns fresh, pre-configured AnyScale instances whose domains
 * and ranges are set according to the provided options. The returned scales
 * are ready for immediate use in plotting routines but can be further
 * configured (e.g. .nice(), tick settings) by the caller.
 *
 * Notes:
 * - xExponent/yExponent are only applied when the corresponding type is "pow".
 * - For time scales, supply Date values for xDomain; numeric domains are used
 *   for linear/log/pow scales.
 * - Log and pow scales fall back to linear if the domain contains non-positive values,
 *   which would otherwise cause a runtime error.
 *
 * @param options.createScales - Options object (see CreateScalesOptions).
 * @returns A ChartScales pair containing xScale and yScale.
 * @example
 * ```ts
 * createScales({ innerHeight: 200, innerWidth: 400, xDomain: [0, 10], yDomain: [0, 100] });
 * ```
 */
export const createScales = ({
  innerHeight,
  innerWidth,
  xDomain,
  xExponent = 2,
  xType = "linear",
  yDomain,
  yExponent = 2,
  yType = "linear",
}: CreateScalesOptions): ChartScales => {
  const xSafeType = isDomainValidForScale(xDomain as readonly number[], xType) ? xType : "linear";
  const ySafeType = isDomainValidForScale(yDomain as readonly number[], yType) ? yType : "linear";

  const xFactory = scaleFactories[xSafeType] ?? scaleFactories.linear;
  const yFactory = scaleFactories[ySafeType] ?? scaleFactories.linear;

  // Determine if domains are invalid so we warn only once when both are bad
  const [xa, xb] = xDomain;
  // eslint-disable-next-line @typescript-eslint/naming-convention -- internal logic variable
  const xInvalid = !Number.isFinite(xa as number) || !Number.isFinite(xb as number);
  // eslint-disable-next-line @typescript-eslint/naming-convention -- mirrors xInvalid
  const ySilent = xInvalid;

  const xScale = (
    xFactory(xExponent) as ScaleLinear<number, number>
  )
    .domain(ensureFiniteDomain(xDomain as readonly [number | undefined, number | undefined], xSafeType))
    .range([0, innerWidth])
    .nice() as AnyScale;
  const yScale = (
    yFactory(yExponent) as ScaleLinear<number, number>
  )
    .domain(ensureFiniteDomain(yDomain as readonly [number | undefined, number | undefined], ySafeType, ySilent))
    .range([innerHeight, 0])
    .nice() as AnyScale;
  return { xScale, yScale };
};
