# Plan 024: Fix Date-domain fallback in ensureFiniteDomain (time scale clips real data)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat ca94562..HEAD -- src/services/scales.mts src/services/__tests__/scales.test.mts src/services/dataWrangling.mts src/chart/chartRender.mts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `ca94562`, 2026-09-04
- **Methodology**: strict TDD — write the failing regression test first, watch
  it fail, then apply the minimal fix.

## Why this matters

`createChart` defaults `xType` to `"time"` (`src/chart/createChart.mts:66`).
When the x accessor returns `Date` objects — the documented, natural way to
feed time-series data — the domain guard `ensureFiniteDomain` runs
`Number.isFinite(new Date())`, which is **always `false`**, and silently
replaces the valid historical domain with `[now, now + 24h]`
(`src/services/scales.mts:105-108`). Every data point older than ~24 hours
then falls outside the scale domain and renders clipped or collapsed at the
edge. The only existing time-scale test passes **epoch numbers**, not Dates
(`scales.test.mts:75-78`), so the suite is green while real Date input is
broken. This is the single highest-severity correctness defect in the
library: the default configuration mis-renders the library's primary use case.

## Current state

Facts verified verbatim at `ca94562`.

### The call chain (bug location in bold step)

1. `src/chart/createChart.mts:66` — `xType = "time"` is the default.
2. `src/chart/chartRender.mts:132-135` —
   `getMultiSeriesExtents(context.state.currentSeries, context.config.xSerie.accessor)`
   returns `xDomain: [Date, Date]` when the accessor returns Dates
   (`src/services/dataWrangling.mts:121-124` uses `d3.extent` directly, no
   coercion).
3. `src/chart/chartRender.mts:151-157` — passes that domain into
   `createScales({ ..., xDomain: xDomainToUse, xType: context.xType, ... })`.
4. **`src/services/scales.mts:91-110` — the bug:**

```ts
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
```

`Number.isFinite(a)` is `false` for a `Date` object even though
`Number.isFinite(Number(a))` is `true`. **Second affected site** — the
duplicate-warning-suppression check in the same file at `:151-155`:

```ts
  const [xa, xb] = xDomain;
  const xInvalid = !Number.isFinite(xa as number) || !Number.isFinite(xb as number);
  const ySilent = xInvalid;
```

Same defect: a valid `[Date, Date]` domain is treated as invalid here too.

5. `src/services/scales.mts:160` — `.domain(ensureFiniteDomain(...))` feeds the
   bogus `[now, now+24h]` domain into `scaleTime()`.

### The type already admits Dates

`CreateScalesOptions.xDomain` is typed
`readonly [Date, Date] | readonly [number, number] | readonly [undefined, undefined]`
(`scales.mts:56`), and the JSDoc at `:122-123` says "For time scales, supply
Date values for xDomain". The runtime contradicts the contract — this plan
aligns runtime with the documented contract.

### The masking test (`src/services/__tests__/scales.test.mts:68-83`)

```ts
  it("creates time scale when xType is 'time'", () => {
    const result = createScales({
      innerHeight: 400,
      innerWidth: 800,
      xDomain: [
        new Date("2023-01-01").getTime(),
        new Date("2023-12-31").getTime(),
      ] as readonly [number, number],
      xType: "time",
      yDomain: [0, 100],
    });
    expect(result.xScale.domain().length).toBe(2);
  });
```

Epoch numbers pass `Number.isFinite`, so the fallback never fires. No test
passes `Date` objects through `createScales`.

### Reproduction (no code change needed)

```js
const { createScales } = await import("./src/services/scales.mjs");
const { xScale } = createScales({
  innerHeight: 200, innerWidth: 400,
  xDomain: [new Date("2020-01-01"), new Date("2020-06-01")],
  xType: "time", yDomain: [0, 3],
});
console.log(xScale.domain()); // [today, today+24h] — WRONG, expected 2020 dates
```

### D3 fact to rely on

`scaleTime().domain()` accepts both `Date` objects and epoch numbers; numbers
are coerced internally via `new Date(number)`. Returning numeric epochs from
`ensureFiniteDomain` for time scales is therefore safe.

### Repo conventions

- Tests: Vitest + jsdom, `src/**/*.test.mts`, globals enabled
  (`vitest.config.mts:39-42`). Structural pattern for this file:
  `src/services/__tests__/scales.test.mts` (existing `describe("createScales")`
  and `describe("empty / all-invalid domain guard")` blocks — extend them).
- Naming: `camelCase` functions, booleans prefixed `is`/`has`
  (`.opencode/opencode.json` style guide; note the existing
  `eslint-disable-next-line @typescript-eslint/naming-convention` comments in
  scales.mts — match that pattern if you introduce a non-conforming local).

## Commands you will need

| Purpose   | Command                                | Expected on success            |
|-----------|----------------------------------------|--------------------------------|
| Typecheck | `pnpm type-check`                      | exit 0, no errors              |
| Tests     | `pnpm exec vitest run`                 | all pass (429 at `ca94562`)    |
| One file  | `pnpm exec vitest run src/services/__tests__/scales.test.mts` | all pass |
| Lint      | `pnpm lint`                            | exit 0                         |
| Build     | `pnpm build`                           | exit 0                         |

Do NOT use bare `pnpm test` — it enters Vitest watch mode and hangs on
non-TTY shells (see `plans/README.md` "Known verification blockers").
The full suite takes ~190s; pass an explicit shell timeout of at least
300000 ms when running it.

## Scope

**In scope** (the only files you should modify):

- `src/services/scales.mts`
- `src/services/__tests__/scales.test.mts`

**Out of scope** (do NOT touch, even though they look related):

- `src/services/dataWrangling.mts` — returning raw `Date` objects from
  `getMultiSeriesExtents` is correct; the bug is in the guard, not the wrangling.
- `src/chart/chartRender.mts` — the type cast at `:154` stays; fixing types
  there is unnecessary churn once the guard accepts Dates.
- Any other scale behavior (log/pow fallbacks, `.nice()`, `scaleExtent`).
- Do not change the warning message text — other tests assert on it
  (`scales.test.mts:158-213` region, plus e2e Scenario C in
  `tests/e2e/README.md` asserts the console warning text).

## Git workflow

- Branch: `advisor/024-date-domain-fix`
- Commits: conventional style, e.g. `test(scales): add failing Date-domain regression test`
  then `fix(scales): accept Date endpoints in ensureFiniteDomain`
  (match `git log` style: `feat(chart): ...`, `fix(chart): ...`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Write the failing regression tests (red)

Add to `src/services/__tests__/scales.test.mts`, inside the existing
`describe("empty / all-invalid domain guard")` block (or a new sibling
`describe("Date domains")`):

1. `createScales` with `xDomain: [new Date("2020-01-01"), new Date("2020-06-01")]`,
   `xType: "time"`, `yDomain: [0, 100]` must NOT fire the fallback warning
   (spy on `console.warn`) and the resulting `xScale` must map both input
   dates into `[0, innerWidth]`:
   `expect(xScale(new Date("2020-01-01"))).toBeGreaterThanOrEqual(0)` and
   `expect(xScale(new Date("2020-06-01"))).toBeLessThanOrEqual(800)`.
2. Same setup: `xScale.domain()` must represent 2020, not the current year —
   assert `xScale.domain()[0].getFullYear() === 2020`
   (`.nice()` may round the exact day; the year is stable).
3. A historical date older than 24h maps to a finite, in-range pixel:
   `Number.isFinite(xScale(new Date("2020-03-15")))` and value within
   `[0, 800]`.

**Verify**: `pnpm exec vitest run src/services/__tests__/scales.test.mts` →
the 3 new tests FAIL (fallback fires, year is the current year), all
pre-existing tests still pass. If the new tests PASS immediately, the bug was
already fixed — STOP and report.

### Step 2: Fix the guard (green)

In `src/services/scales.mts`, change the validity checks to coerce before
testing finiteness. `Number(new Date())` yields the epoch (finite);
`Number(undefined)` yields `NaN` (correctly invalid); `Number(NaN)` stays
`NaN`. Minimal change in `ensureFiniteDomain`:

- Replace `Number.isFinite(a as number) && Number.isFinite(b as number)` with
  a coercion-based check, e.g. a file-local helper
  `const isFiniteEndpoint = (v: unknown): boolean => v !== undefined && v !== null && Number.isFinite(Number(v));`
- When valid, return `[Number(a), Number(b)]` (numeric epochs). This is safe
  for `scaleTime` (coerces numbers to Dates) and keeps the return type
  `[number, number]` unchanged.

Apply the same coercion in the `xInvalid` computation at `:151-155` (reuse
the helper) so the duplicate-warning suppression agrees with the guard.

**Verify**: `pnpm exec vitest run src/services/__tests__/scales.test.mts` →
all tests pass, including the 3 new ones.

### Step 3: Full gate

**Verify**: `pnpm type-check` → exit 0. Then `pnpm exec vitest run` → all
pass (429 + 3 new = 432). Then `pnpm lint` → exit 0. Then `pnpm build` →
exit 0.

## Test plan

- New tests: the 3 listed in Step 1, in `src/services/__tests__/scales.test.mts`.
- Existing tests that must keep passing unchanged: the whole
  `describe("empty / all-invalid domain guard")` block (undefined/NaN/mixed
  domains must still fall back and warn exactly once) and the epoch-number
  time-scale test at `:68-83`.
- Verification: `pnpm exec vitest run` → all pass.

## Done criteria

- [ ] `pnpm type-check` exits 0
- [ ] `pnpm exec vitest run` exits 0; the 3 new Date-domain tests exist and pass
- [ ] The fallback `console.warn` does NOT fire for valid `[Date, Date]` domains
- [ ] The existing fallback tests (undefined/NaN/mixed) still pass unmodified
- [ ] `pnpm lint` and `pnpm build` exit 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The excerpts in "Current state" don't match the live code (drift).
- The new tests from Step 1 pass BEFORE the fix (bug already fixed elsewhere —
  report who/when via `git log -p src/services/scales.mts`).
- The fix appears to require editing `dataWrangling.mts` or `chartRender.mts`.
- Existing fallback-guard tests cannot be kept green without weakening their
  assertions (e.g. the warning-once behavior breaks).

## Maintenance notes

- After this lands, `xScale.domain()` for Date input returns `Date` objects
  produced by `scaleTime`'s own coercion of the numeric epochs — consumers
  see Dates as before.
- A reviewer should scrutinize: (1) that `Number()` coercion was used rather
  than `instanceof Date` (coercion also accepts epoch numbers and keeps the
  signature stable), (2) that the warning text is byte-identical.
- Follow-up explicitly deferred: single-point time domains (`[d, d]`) still
  collapse to a zero-width domain; that is plan 026's documented-contract
  territory, not this plan.
- The e2e harness (`tests/e2e/harness.html`) currently exercises scenario A-F
  with epoch-number data; a Date-data browser scenario is a candidate future
  addition to `tests/e2e/README.md` but is NOT part of this plan.
