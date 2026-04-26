# Contract: Theme System API

> Public API surface for F001 Theme System.

## `mergeTheme(base, override?)`

**Signature**:
```typescript
function mergeTheme(base: Theme, override?: ThemeOverride): Theme
```

**Behavior**: Deeply merges override with base. Preserves base values where override is undefined. Arrays are replaced, not concatenated.

**Parameters**:
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| base | Theme | Yes | Default theme to merge into |
| override | ThemeOverride | No | Partial overrides (optional — returns base unchanged if omitted) |

**Returns**: A new Theme object (never mutates inputs). All properties deeply resolved.

---

## `applyThemeCssVars(container, theme)`

**Signature**:
```typescript
function applyThemeCssVars(container: HTMLElement, theme: Theme): void
```

**Behavior**: Writes CSS custom properties to `container.style` using `--vl-` prefix. Must be called BEFORE `renderSVG()`.

**CSS Variables Set**:
```
--vl-background         (theme.colors.background)
--vl-axis-color         (theme.colors.axis)
--vl-text-color         (theme.colors.text)
--vl-grid-stroke        (theme.colors.grid)
--vl-line-stroke        (first palette color)
--vl-point-fill         (first palette color)
--vl-axis-font-size     (theme.axis.fontSize)
--vl-axis-tick-size     (theme.axis.tickSize)
--vl-axis-tick-padding  (theme.axis.tickPadding)
--vl-grid-dasharray     (theme.grid.dashArray)
--vl-grid-opacity       (theme.grid.opacity)
--vl-grid-strokewidth   (theme.grid.strokeWidth)
--vl-grid-linecap       (theme.grid.strokeLinecap)
--vl-line-opacity       (theme.line.opacity)
--vl-line-strokewidth   (theme.line.strokeWidth)
--vl-point-radius       (theme.points.radius)
--vl-point-opacity      (theme.points.opacity)
--vl-point-stroke       (theme.points.stroke)
--vl-point-strokewidth  (theme.points.strokeWidth)
--vl-title-font-size    (theme.title.fontSize)
--vl-title-font-weight  (theme.title.fontWeight)
--vl-title-color        (theme.title.color)
--vl-title-padding      (theme.title.padding)
--vl-tooltip-background (theme.tooltip.background)
--vl-tooltip-border     (theme.tooltip.border)
--vl-tooltip-radius     (theme.tooltip.borderRadius)
--vl-tooltip-color      (theme.tooltip.color)
--vl-tooltip-font-size  (theme.tooltip.fontSize)
--vl-tooltip-padding    (theme.tooltip.padding)
```

---

## `resolveCurve(input)`

**Signature**:
```typescript
function resolveCurve(input: CurveFactory | CurvePreset): CurveFactory
```

**Behavior**: Resolves a curve preset string to its D3 CurveFactory, or passes through an existing factory unchanged.

**Parameters**:
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| input | CurveFactory \| CurvePreset | Yes | Preset name or factory |

**Returns**: A D3 CurveFactory function.

**Throws**:
- `Error("Unknown curve preset: [name]. Valid presets: [list]")` if preset name is invalid

---

## `CURVE_PRESETS`

**Type**: `Readonly<Record<CurvePreset, CurveFactory>>`

**Value**: Map of all 18 supported curve preset names to their D3 factory implementations.

---

## `defaultTheme`

**Type**: `Theme`

**Value**: Sensible defaults for all visual styling tokens. Used as the base for `mergeTheme()`.
