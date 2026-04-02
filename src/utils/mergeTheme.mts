import type { Theme, ThemeOverride } from "@/types/index.mjs";

type PlainObject = Record<string, unknown>;

/**
 * Deep-merges `override` into `base`.
 *
 * Rules:
 * - Plain objects are recursively merged (keys from override win).
 * - Arrays are replaced wholesale (so `palette` is always the override array).
 * - Primitive values from override replace those in base.
 * - `undefined` values in override are ignored (base value is kept).
 */
const deepMerge = <T extends PlainObject>(
  base: T,
  override: PlainObject,
): T => {
  const result: PlainObject = { ...base };

  for (const key of Object.keys(override)) {
    const overrideVal = override[key];
    const baseVal = base[key];

    if (overrideVal === undefined) continue;

    const overrideIsPlainObject =
      overrideVal !== null &&
      typeof overrideVal === "object" &&
      !Array.isArray(overrideVal);

    const baseIsPlainObject =
      baseVal !== null &&
      typeof baseVal === "object" &&
      !Array.isArray(baseVal);

    if (overrideIsPlainObject && baseIsPlainObject) {
      result[key] = deepMerge(
        baseVal as PlainObject,
        overrideVal as PlainObject,
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
 * @example
 * const theme = mergeTheme(defaultTheme, { line: { strokeWidth: 3 } });
 */
export const mergeTheme = (base: Theme, override?: ThemeOverride): Theme => {
  if (!override) return base;
  return deepMerge(
    base as unknown as PlainObject,
    override as PlainObject,
  ) as unknown as Theme;
};
