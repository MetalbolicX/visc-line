# Data Model — F001: Theme System

> Generated during /speckit-plan for F001.

## Entity: Theme

**Owner**: F001 (Theme System)
**Source**: `src/types/themeTypes.mts`

```typescript
interface Theme {
  readonly accessibility?: {
    readonly highContrast?: boolean;
    readonly reducedMotion?: boolean;
  };
  readonly axis: {
    readonly color?: string;
    readonly fontSize: number;
    readonly tickPadding: number;
    readonly tickSize: number;
  };
  readonly colors: {
    readonly axis: string;
    readonly background: string;
    readonly grid: string;
    readonly palette: readonly string[];
    readonly text: string;
  };
  readonly grid: {
    readonly dashArray: string;
    readonly opacity: number;
    readonly stroke: string;
    readonly strokeLinecap: string;
    readonly strokeWidth: number;
  };
  readonly legend: {
    readonly fontSize: number;
    readonly itemSpacing: number;
    readonly position: "bottom" | "left" | "right" | "top";
    readonly symbolSize: number;
  };
  readonly line: {
    readonly curve: CurvePreset;
    readonly opacity: number;
    readonly strokeWidth: number;
  };
  readonly points: {
    readonly fill: string;
    readonly opacity: number;
    readonly radius: number;
    readonly stroke: string;
    readonly strokeWidth: number;
  };
  readonly title: {
    readonly color: string;
    readonly fontSize: number;
    readonly fontWeight: number;
    readonly padding: number;
  };
  readonly tooltip?: {
    readonly background: string;
    readonly border: string;
    readonly borderRadius: number;
    readonly color: string;
    readonly fontSize: number;
    readonly padding: number;
  };
}
```

## Entity: ThemeOverride

**Type**: `DeepPartial<Theme>` — every property optional recursively

## Entity: CurvePreset

**Type**: Union of 18 string literals:
```
"basis" | "basisClosed" | "basisOpen" |
"bumpX" | "bumpY" |
"cardinal" | "cardinalClosed" | "cardinalOpen" |
"catmullRom" | "catmullRomClosed" | "catmullRomOpen" |
"linear" | "monotoneX" | "monotoneY" | "natural" |
"step" | "stepAfter" | "stepBefore"
```

## Entity: CURVE_PRESETS

**Type**: `Readonly<Record<CurvePreset, CurveFactory>>` — maps each preset name to its D3 factory

## State Transitions

None — Theme is stateless. Applied once at chart creation.

## Relationships

| Entity | Owner | Consumers |
|--------|-------|-----------|
| Theme | F001 | All Features (via CSS variables) |
| CurvePreset | F001 | F006 (Line Rendering) |
| CURVE_PRESETS | F001 | Chart Core |
