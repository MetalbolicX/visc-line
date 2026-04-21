import type { Theme, ThemeOverride } from "@/types/index.mjs";

type PlainObject = Record<string, unknown>;

/**
 * @param value - Any value to check.
 * @returns True if value is a plain non-array object.
 */
const isPlainObject = (value: unknown): value is PlainObject =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value);

/**
 * Deep-merges `override` into `base`.
 *
 * Rules:
 * - Plain objects are recursively merged (keys from override win).
 * - Arrays are replaced wholesale (so `palette` is always the override array).
 * - Primitive values from override replace those in base.
 * - `undefined` values in override are ignored (base value is kept).
 *
 * @param base - The base object to merge into.
 * @param override - The override object providing override values.
 * @returns A new merged object of type T.
 */
const deepMerge = <T extends PlainObject>(
  base: T,
  override: PlainObject,
): T => {
  /**
   *
   */
  const result: PlainObject = { ...base };

  for (/**
        *
        */
  const key of Object.keys(override)) {
    /**
     *
     */
    const overrideVal = override[key];
    /**
     *
     */
    const baseVal = base[key];

    if (overrideVal === undefined) continue;

    if (isPlainObject(overrideVal) && isPlainObject(baseVal)) {
      result[key] = deepMerge(
        baseVal,
        overrideVal,
      );
    } else {
      result[key] = overrideVal;
    }
  }

  return result as T;
};

/**
 * Merges a (partial) theme override on top of a base theme and returns a
 * new, fully-typed `Theme` object.  The base theme is never mutated.
 *
 * @param base - The base theme to apply overrides onto.
 * @param override - An optional partial override object.
 * @returns A fully resolved Theme object.
 *
 * @example
 * const theme = mergeTheme(defaultTheme, { line: { strokeWidth: 3 } });
 */
export /**
        *
        */
const mergeTheme = (base: Theme, override?: ThemeOverride): Theme => {
  if (!override) return base;
  return deepMerge(
    base as unknown as PlainObject,
    override as PlainObject,
  ) as unknown as Theme;
};