# viscline Custom Callback Feature - Session Learnings

**Session:** 2026-04-26
**Topic:** withCustom callback API design and implementation
**Outcome:** Feature shipped; 274 tests passing

---

- `FeatureFlags.hasCustom` was added alongside `ChartState.hasCustom` — the flag exists on both objects, which is intentional so `clearOptionalNodes` could theoretically clear custom elements in the future without accessing internal state directly.

- The custom callback execution block in `chartRender.mts:272` runs AFTER the zoom/pan block (lines 221–265) and BEFORE `clearOptionalNodes`. This order was chosen so user D3 code draws on top and isn't interfered with by tooltip overlays or zoom resets.

- Cleanup runs at TWO points: (1) before each re-execution of the callback via `context.state.customCleanup?.()` in `chartRender.mts:280, (2) in `dispose()` before other teardown via `state.customCleanup?.()` in `createChart.mts:150`.

- The last-write-wins behavior (calling `withCustom(fn2)` overwrites `fn1`) relies on `fn1`'s cleanup running BEFORE `fn2` executes. Users MUST return a cleanup function if their callback appends DOM — otherwise duplicate elements will accumulate on each re-render.

- `withCustom(null)` calls `render()`, which means the prior cleanup runs one final time, then `state.customCallback` and `state.customCleanup` are nulled. Calling `withCustom(null)` on a disposed chart throws because `ensureActive()` is called before any state mutation.

- `ChartInstance` does NOT expose a `content` property — only `container`, `svg`, `series`, `dispose`, and `update`. All D3 DOM access inside the custom callback goes through `ctx.content` (the clipped content group selection).

- `getDimensions()` in `src/services/layout.mts:21` uses `getBoundingClientRect()` which returns `0` for both `width` and `height` in jsdom's `ResizeObserver` setup unless `clientWidth`/`clientHeight` are explicitly mocked on the container element (as done in the test `beforeEach`).

- The `reducedMotion` theme flag in `createChart.mts:89` is read once at chart creation time and stored in the closure — it does not change on re-render.

- `renderContentGroup` always upserts `<defs>` + `<clipPath id="chart-content-clip">` on every call, making it idempotent but also meaning clip-path is recreated on every render cycle even if dimensions haven't changed.
