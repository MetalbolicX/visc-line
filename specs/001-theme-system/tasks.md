# Tasks — F001: Theme System

> Generated from plan.md implementation phases.

## Task List

| ID | Task | Phase | Priority | File(s) |
|----|------|-------|----------|---------|
| T001 | Implement `mergeTheme()` with DeepPartial deep merge | 1 | P1 | `src/utils/mergeTheme.mts` |
| T002 | Write unit tests for `mergeTheme()` | 1 | P1 | `src/utils/__tests__/mergeTheme.test.mts` |
| T003 | Implement `applyThemeCssVars()` | 2 | P1 | `src/utils/cssVariables.mts` |
| T004 | Write unit tests for `applyThemeCssVars()` | 2 | P1 | `src/utils/__tests__/cssVariables.test.mts` |
| T005 | Implement `resolveCurve()` + `CURVE_PRESETS` | 3 | P2 | `src/utils/curveMap.mts` |
| T006 | Write unit tests for `resolveCurve()` + `CURVE_PRESETS` | 3 | P2 | `src/utils/__tests__/curveMap.test.mts` |
| T007 | Verify all type exports (Theme, ThemeOverride, CurvePreset) | — | P2 | `src/types/themeTypes.mts` |
| T008 | Create demo script | — | P2 | `demos/F001-theme-system.sh` |

## Task Dependencies

```
T001 (mergeTheme)
  ↓
T002 (mergeTheme tests)

T003 (cssVariables)
  ↓
T004 (cssVariables tests)

T005 (curveMap)
  ↓
T006 (curveMap tests)

T007 (type exports) — independent, can run anytime
T008 (demo) — depends on T001 + T002 + T003 + T004 + T005 + T006
```

## Estimated Complexity

| Task | Effort | Risk |
|------|--------|------|
| T001 | Small | Low — pure function, no side effects |
| T002 | Small | Low — input/output testing |
| T003 | Small | Low — DOM manipulation |
| T004 | Small | Low — jsdom environment |
| T005 | Small | Low — map lookup |
| T006 | Small | Low — 18 presets + invalid case |
| T007 | Small | Low — type checking via tsc |
| T008 | Small | Low — import and call functions |
