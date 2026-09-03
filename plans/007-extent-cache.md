# Plan 007: Make the extent cache per-chart and collision-proof

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 5860f3e..HEAD -- src/services/dataWrangling.mts src/chart/chartState.mts src/chart/createChart.mts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED (touches the data hot path used by every render)
- **Depends on**: plans/002-characterization-suite.md, plans/004-empty-data-guard.md
- **Category**: bug
- **Planned at**: commit `5860f3e`, 2026-09-01

## Why this matters

The extent cache is a MODULE-LEVEL `Map` shared by every chart instance on
the page (verified: `src/services/dataWrangling.mts:75-81`), and its key
fingerprint is `String(s.data[0]).slice(0, 8)` (verified: ~lines 94-102) —
which is the constant string `"[object "` for ANY object-typed data point.
Two failure modes: (1) `chartA.update(x)` calls the exported
`clearExtentCache()` and wipes chartB's cache — a hidden global side effect
that defeats the cache for multi-chart pages; (2) any future code path that
mutates a series' contents in place without clearing the cache gets stale
extents whenever label+length collide. Today correctness is preserved only
because `createChart.update()` happens to clear the whole global cache
every time — an incidental invariant, not a designed one.

## Current state

- `src/services/dataWrangling.mts:75-81` — `const extentCache = new Map<...>()` at module scope.
- `src/services/dataWrangling.mts:94-102` — cache key built from `String(s.data[0]).slice(0, 8)` + `encodeURIComponent(s.label)` + length.
- `src/services/dataWrangling.mts:168-170` — `clearExtentCache()` clears the entire Map (module-global side effect).
- `src/chart/createChart.mts:218` — `update()` calls `clearExtentCache()`.
- The docstring at ~lines 64-81 claims the key "avoids collisions" — false for object `T` (finding BUG-10 from the audit).
- Consumers: `getMultiSeriesExtents(...)` used by `chartRender.mts` (initial + zoom paths) and `createChart.update()`.
- Test exemplar: `src/services/__tests__/dataWrangling.test.mts` (259 lines — includes existing cache tests; extend, don't rewrite).

## Commands you will need

| Purpose   | Command | Expected on success |
|-----------|---------|---------------------|
| Red run   | `pnpm test -- dataWrangling` | new isolation test FAILS before fix |
| Green run | `pnpm test` | all pass |
| Typecheck | `pnpm type-check` | exit 0 |

## Scope

**In scope**:
- `src/services/dataWrangling.mts`
- `src/chart/createChart.mts` (the `clearExtentCache()` call site only)
- `src/services/__tests__/dataWrangling.test.mts`
- `src/internal.mts` ONLY IF it re-exports `clearExtentCache` (check; if so, update the re-export)

**Out of scope**:
- `chartState.mts` shape changes beyond what's needed to host/store a per-chart cache instance (prefer passing the cache or keying differently — see steps).
- `chartRender.mts` (it consumes `getMultiSeriesExtents` through the same signature — keep the signature stable).
- Perf work on extent computation itself.

## Git workflow

- Branch: `advisor/007-extent-cache`
- Commit 1: `test: pin per-chart cache isolation (red)`. Commit 2: `refactor: scope extent cache per chart, fingerprint data content`.
- Do NOT push unless instructed.

## Steps

### Step 1: Write the failing isolation test (RED)

In `dataWrangling.test.mts`:

1. Isolation: create series sets A and B (same labels, same lengths, DIFFERENT object data — the collision shape). Compute extents for A; then for B; assert B's extents reflect B's data (currently the cache may return A's for B — make the data differ enough that extents differ).
2. Cross-instance invalidation: compute extents for A, then call whatever invalidation `update()` would trigger for an unrelated series set C; re-compute A WITHOUT mutating it — assert A's cached result is still returned (i.e. invalidation of one chart's data must not evict another's). NOTE: with the current global-clear design this fails by design — that is the point of the red test.

**Verify**: `pnpm test -- dataWrangling` → new tests fail.

### Step 2: Redesign the cache (GREEN)

Preferred shape (adjust to actual code structure):

1. Replace the module-level `Map` with a per-call-graph cache owned by the chart: simplest robust option — key the cache by IDENTITY: `WeakMap<typeof seriesArray, ExtentsResult>` in `dataWrangling.mts`, where the key is the series ARRAY reference. Identity keying makes collisions impossible and makes "data mutated in place" the only staleness vector.
2. Because `update()` REPLACES `state.allSeries`/`state.currentSeries` with new array references, a fresh array naturally misses the WeakMap — no explicit clearing needed. Remove the exported `clearExtentCache()` (or reduce it to a no-op deprecated re-export if `internal.mts` exposes it — check and update).
3. Delete the misleading "avoids collisions" docstring sentence; document the real guarantee: "cached per series-array identity; replace the array (as `update()` does) to recompute".
4. Update `createChart.mts:218` to stop calling `clearExtentCache()`.
5. If profiling-shaped tests exist for cache hits, keep them passing via the WeakMap path.

**Verify**: `pnpm test` → all pass. `grep -n "extentCacheKey" src/services/dataWrangling.mts` → no matches (content-fingerprint key deleted).

### Step 3: Full check

**Verify**: `pnpm check` → exit 0.

## Test plan

Step 1's two cases + keep all 259 lines of existing dataWrangling tests green (they pin extent math, which must not change). Add one test documenting: mutating a series array IN PLACE is not observed (documents the WeakMap contract honestly).

## Done criteria

- [ ] `pnpm check` exits 0
- [ ] No module-level mutable cache state: `grep -n "^const extentCache\|^let " src/services/dataWrangling.mts` → no shared-cache matches
- [ ] `clearExtentCache` is gone or a documented no-op; `createChart.mts` no longer calls it
- [ ] Collision + isolation tests pass
- [ ] No files outside the in-scope list modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- `getMultiSeriesExtents`'s signature or callers differ materially from the description (drift) — report.
- Removing the global clear breaks a green test that explicitly depends on cross-chart clearing — report the test; that's a contract conversation, not a silent change.
- In-place mutation of `state.currentSeries` (rather than replacement) is found anywhere in `createChart.mts` after closer reading — the WeakMap design needs that fact surfaced before proceeding.

## Maintenance notes

- The WeakMap contract ("replace the array to recompute") belongs in the JSDoc of `getMultiSeriesExtents` and in AGENTS.md's render-flow notes.
- If streaming/in-place-append updates are ever added (direction item), the cache must move to a versioned key or explicit per-chart invalidation — do not resurrect the global clear.
