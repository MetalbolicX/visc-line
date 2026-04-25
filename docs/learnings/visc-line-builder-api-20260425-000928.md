# visc-line Builder API Session Learnings

**Session date:** 2026-04-25
**Topic:** Fluent builder conversion of `createChart` / removal of `createMinimalChart`

---

## Technical Discoveries

- **`SVGElement.prototype` is the correct mock target for `getTotalLength` in jsdom.**
  D3's `renderLine` update path calls `this.getTotalLength()` inside a `.each()` callback on a `Selection<SVGPathElement, ...>`. In jsdom, the method exists on `SVGElement.prototype`, not exclusively on `SVGPathElement.prototype`. Mocking on the base `SVGElement` ensures both entry and update paths work.
  **File:** `src/components/__tests__/chart.test.mts`

- **`observeResize` captures its callback at construction time — but the builder reuses one `render` function.**
  Because the single `render` closure reads mutable component flags (`hasAxes`, `hasGrid`, etc.) and the current `dims`/`xScale`/`yScale` via `getDimensions`/`createScales` on every call, the resize observer always sees fresh state even though the callback reference is captured once.
  **File:** `src/components/chart.mts`

- **A stable single object (`const chart`) vs a function returning a new object (`instance()`) determines builder identity.**
  The original design used `const instance = (): ChartInstance<T> => ({...})` with `return instance()` on every `with*` call — this created a new object on every chain step. Switching to `const chart: ChartInstance<T> = {...}` returned the same object reference, making `chart.withAxes() === chart` true and eliminating subtle aliasing bugs.
  **File:** `src/components/chart.mts`

- **Structural equality is required for option objects — reference equality (`===`) fails for structurally equivalent user-provided options.**
  When a user calls `.withTitle({ title: "X" })` twice, both objects are different references. Equality helpers (`areTitleOptionsEqual`, `areLegendOptionsEqual`, etc.) must compare the structural contents, not object identity. Legend options require item-by-item comparison since arrays are reference-different even when contents match.
  **File:** `src/components/chart.mts`

- **`eslint-plugin-functional` actively prohibits class-based patterns.**
  The project's ESLint config enables `functional/immutable-data` and `functional/prefer-readonly-type` as errors. A class-based builder would require disabling multiple ESLint rules. The WeakMap registry pattern provides module-private state without any class syntax.
  **File:** `eslint.config.mjs`

## Architectural Constraints Established

- **Builder methods are idempotent — same-component guard prevents redundant re-renders.**
  If `hasAxes` is already `true`, calling `.withAxes()` returns `chart` immediately without triggering another `render()`. This also prevents infinite recursion when the same stable object is returned.

- **`dispose()` must be idempotent and callable on any instance in the chain.**
  All `with*` methods return the same `chart` object, so `dispose()` is always the canonical cleanup function. Multiple calls to `dispose()` must not throw.

- **`update()` after `dispose()` must throw — not silently fail.**
  A guard check `if (isDisposed) throw new Error(...)` prevents silent failures that would confuse consumers debugging memory leaks.

- **The render pipeline always re-runs `getDimensions` + `createScales` on every resize and every `with*` call.**
  There is no caching of scales/dims — each render is a full recalculation. This is intentional for correctness; if container size changes, all scales must update.

## Debugging Breakthroughs

- **`renderLine` update path crashes on `getTotalLength` before the SVGPathElement mock is set up.**
  The existing tests had the mock only for `SVGPathElement.prototype` in `beforeEach`. The builder tests also needed `writable: true, configurable: true` on the mock descriptor to avoid/protect from describe-block isolation issues in Vitest.

- **The `addTooltip` test assertion needed changing from cursor-line DOM check to tipviz custom element existence.**
  `addTooltip` renders a `<tip-viz-tooltip>` custom element into `document.body` — not into the chart's SVG. The cursor line (`line.tooltip-cursor`) only appears on mousemove. The test now checks `document.body.querySelector("tip-viz-tooltip")` instead.
  **File:** `src/components/__tests__/chart.test.mts`
