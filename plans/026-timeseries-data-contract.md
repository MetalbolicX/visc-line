# Plan 026: Time-series data contract — sort guarantee, duplicates, timezone, docs

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat ca94562..HEAD -- src/services/dataWrangling.mts src/services/__tests__/dataWrangling.test.mts docs/api-reference.md README.md src/chart/__tests__`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition. NOTE: plan 025 also edits
> `dataWrangling.mts` — if 025 has landed, this plan applies on top of it.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: plans/025-gap-policy-defined.md (same primary file; land 025
  first)
- **Category**: bug (unsorted input), docs (duplicates/timezone/single-point)
- **Planned at**: commit `ca94562`, 2026-09-04
- **Methodology**: TDD for the sort; characterization tests for the
  documented-only behaviors.

## Why this matters

An automated time-series builder must not trust input order. Today
`processAllSeries` filters but never sorts
(`src/services/dataWrangling.mts:33-62`), and `renderLine` consumes
`serie.data` in given order (`src/components/line.mts:70-76`) — unsorted
timestamps produce a backtracking zigzag polyline while the extent-based
axes look perfectly normal, so the chart is subtly wrong without any visible
error. The tooltip already sorts defensively
(`src/interactivity/tooltip.mts:63,138,169-171`), which proves the library
internally assumes sorted data. This plan makes the guarantee real at the
wrangling seam and writes down the rest of the contract — duplicates,
single-point domains, date strings, timezone — so consumers know exactly
what the builder does with their data.

## Current state

Facts verified verbatim at `ca94562`.

### The filter-only pipeline — `src/services/dataWrangling.mts:33-62`

```ts
export const processNumericData = <T,>(
  rawData: readonly T[],
  xAccessor: (d: T) => unknown,
  yAccessor: (d: T) => unknown,
): readonly T[] =>
  rawData.filter(
    (d) => isValidNumber(xAccessor(d)) && isValidNumber(yAccessor(d)),
  );

export const processAllSeries = <T,>(
  rawData: readonly T[],
  xAccessor: (d: T) => unknown,
  ySeries: readonly SeriesDescriptor<T>[],
): readonly ProcessedSeries<T>[] =>
  ySeries.map((serie) => ({
    ...serie,
    data: processNumericData(rawData, xAccessor, serie.accessor),
  }));
```

`processAllSeries` is called from exactly two places: `createChart`
(`src/chart/createChart.mts:123-127`) and `update`
(`src/chart/createChart.mts:217-221`). Sorting inside `processAllSeries`
therefore covers both initial render and updates with one change.

### Sort key coercion

`isValidNumber` (`dataWrangling.mts:13-18`) accepts `Date` objects and finite
numbers. A sort comparator must coerce the same way: `Date` → `.getTime()`,
numbers pass through. `Number(new Date())` is the epoch; `Number(5)` is `5`.
A single `Number(...)` coercion serves both, but keep the comparator
file-local and typed against `unknown`.

### Behaviors to DOCUMENT (not change)

1. **Duplicate x values**: kept as-is. Line gets zero-length segments (which
   inflates the dash-animation length at `line.mts:104-113`); the tooltip
   bisector picks one boundary datum among ties (`tooltip.mts:284-289`).
   No dedupe is added — document that duplicates are rendered in given order
   (after sorting, stable) and that tie behavior in tooltips is unspecified.
2. **Single-point series**: `extent([v, v])` yields a zero-width domain that
   passes the finite guard (`src/services/scales.mts:97`) and `.nice()`
   cannot expand it, so the single point maps to the left edge. Documented
   limitation; no domain-padding logic in this plan.
3. **Date strings**: `"2023-01-01"` as an x value fails `isValidNumber`
   (`Number("2023-01-01")` is NaN) and the row is **silently dropped**.
   Consumers must construct `Date` objects themselves — the library does not
   parse. This needs a loud docs note (it interacts with plan 024: once Date
   domains work, Date construction becomes THE supported path).
4. **Timezone**: scales use `scaleTime` (browser-local time). A consumer
   building `new Date("2023-01-01")` gets UTC-midnight parsed per the ES
   spec, rendered at local offset — day-boundary labels can shift by the
   local UTC offset. Document that tick placement/formatting is
   browser-local; a `scaleUtc` variant is explicitly deferred.

### Docs homes

- `docs/api-reference.md` — add a "Data contract" section (the file is
  472 lines; place it after "### Domain Behavior" at line ~148).
- `README.md` — one short paragraph + pointer to the API reference.

### Conventions

- Tests: Vitest + jsdom, model after `src/services/__tests__/dataWrangling.test.mts`.
- `processNumericData` is exported through `src/internal.mts`; its signature
  must not change.

## Commands you will need

| Purpose   | Command                                            | Expected on success         |
|-----------|----------------------------------------------------|-----------------------------|
| Typecheck | `pnpm type-check`                                  | exit 0, no errors           |
| Tests     | `pnpm exec vitest run`                             | all pass                    |
| One file  | `pnpm exec vitest run src/services/__tests__/dataWrangling.test.mts` | all pass |
| Lint      | `pnpm lint`                                        | exit 0                      |
| Build     | `pnpm build`                                       | exit 0                      |

Do NOT use bare `pnpm test` (watch mode hangs on non-TTY). Full suite ~190s —
pass a shell timeout of at least 300000 ms.

## Scope

**In scope** (the only files you should modify):

- `src/services/dataWrangling.mts` — add sorting to `processAllSeries`
- `src/services/__tests__/dataWrangling.test.mts`
- `src/chart/__tests__/` — one integration test (unsorted input through
  `createChart` renders a non-backtracking path)
- `docs/api-reference.md` — new "Data contract" section
- `README.md` — one paragraph + pointer

**Out of scope**:

- Dedupe, domain padding for single points, `scaleUtc`, date-string parsing —
  documented limitations only.
- `src/components/line.mts`, `src/interactivity/tooltip.mts` — no changes.
- Plan 025's gap-policy work (lands separately, before this).

## Git workflow

- Branch: `advisor/026-timeseries-data-contract`
- Commits: conventional, e.g. `fix(data): sort series by x in processAllSeries`,
  `docs(api): document time-series data contract`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Failing sort test (red)

In `dataWrangling.test.mts`: `processAllSeries` with input
`[{x:3,y:3},{x:1,y:1},{x:2,y:2}]` must return series data ordered x=1,2,3.
Repeat with `Date` x values out of order.

**Verify**: `pnpm exec vitest run src/services/__tests__/dataWrangling.test.mts`
→ new tests FAIL, existing pass.

### Step 2: Implement sorting (green)

In `dataWrangling.mts`, inside `processAllSeries`, sort each series' filtered
data ascending by coerced x. Requirements:

- Stable sort (`Array.prototype.toSorted` is stable; the repo targets Node
  >20 / modern browsers — `toSorted` is acceptable, but if lint or tsconfig
  lib settings reject it, use `[...arr].sort(...)`).
- Comparator: `(a, b) => Number(xAccessor(a)) - Number(xAccessor(b))` —
  correct for both `Date` (epoch) and number x values. Define it file-local
  next to `isValidNumber`.
- Do not mutate the caller's raw array.

**Verify**: same command → all pass.

### Step 3: Integration test — no backtracking

New test under `src/chart/__tests__/`: `createChart` with unsorted Date-x
data renders a `<path class="chart-line">` whose x pixel coordinates are
non-decreasing along the path (parse the `d` attribute or assert via
`xScale` mapping of the rendered sequence — executor's choice, but assert
ORDER, not just presence).

**Verify**: `pnpm exec vitest run src/chart/__tests__` → all pass.

### Step 4: Documentation

1. `docs/api-reference.md`, new section after "Domain Behavior":

   - **Sorting**: series data is sorted ascending by x before rendering;
     input order is not trusted.
   - **Invalid rows**: rows where x or y is null/undefined/NaN/±Infinity or
     an invalid Date are dropped per series (cross-reference `gapPolicy`
     from plan 025 for how y-gaps render).
   - **Date strings are not parsed**: x values must be `Date` objects or
     finite numbers; ISO strings are treated as invalid and dropped.
   - **Duplicates**: duplicate x values are kept; tooltip tie-breaking among
     equal x values is unspecified.
   - **Timezone**: time scales operate in browser-local time
     (`d3.scaleTime`); construct Dates accordingly.
   - **Single-point series**: a domain with equal endpoints maps to the left
     edge; pad your data or set explicit domains if this matters.

2. `README.md`: one paragraph under the usage section summarizing "input is
   validated, sorted, and gaps are visible — see the data contract in the API
   reference."

**Verify**: `pnpm type-check && pnpm lint && pnpm build` → all exit 0.

## Test plan

- New: sort-order unit tests (numeric + Date x), stability check (equal x
  keeps relative order), no-mutation check (input array identity/order
  unchanged), integration no-backtracking test.
- Existing: entire `dataWrangling.test.mts` must pass unmodified (sorting
  must not break the extent-cache tests at `:241,295,307` — those use
  already-sorted fixtures).
- Verification: `pnpm exec vitest run` → all pass.

## Done criteria

- [ ] `pnpm type-check` exits 0
- [ ] `pnpm exec vitest run` exits 0; new sort + integration tests exist and pass
- [ ] `processAllSeries` output is x-ascending for numeric and Date inputs
- [ ] Caller arrays are not mutated
- [ ] "Data contract" section exists in `docs/api-reference.md` covering the
      six bullets in Step 4
- [ ] `pnpm lint` and `pnpm build` exit 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The excerpts in "Current state" don't match the live code (drift),
  INCLUDING changes landed by plan 025 — re-read `dataWrangling.mts` fresh.
- Sorting inside `processAllSeries` breaks the extent-cache identity tests
  (that would mean the cache keys depend on unsorted identity — report the
  coupling instead of working around it).
- `toSorted` fails type-check AND `[...arr].sort` triggers an immutability
  lint error that cannot be resolved with the repo's existing
  eslint-disable patterns.
- You find a third caller of `processAllSeries` not listed in "Current state".

## Maintenance notes

- Sorting makes "last point" well-defined per series — plan 030 (end-of-line
  labels) relies on this but also computes max-x defensively on its own.
- A reviewer should scrutinize: comparator correctness for mixed
  Date/number input, input-array immutability, and that the docs do not
  promise behavior the tests don't pin.
- Explicitly deferred: `scaleUtc` option, date-string parsing, duplicate-x
  dedupe, single-point domain padding. Each is a documented limitation until
  a consumer asks.
