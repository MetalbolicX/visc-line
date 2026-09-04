# Plan 020: Remove dead exports and the duplicate Dimensions type

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat f884f20..HEAD -- src/chart/featureRegistry.mts src/types/layoutTypes.mts`
> NOTE: plan 018 restructures featureRegistry.mts heavily — if 018 landed, re-run the
> Step 1 greps against the post-018 layout (defs live in their own files; some of this
> plan may already be done — skip completed items and note it). If 018 has NOT landed,
> the anchors below are current.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/018-registry-decomposition.md (to avoid double-editing the same
  file; see drift note — if 018 is blocked long-term, this plan CAN run standalone)
- **Category**: tech-debt (API hygiene)
- **Methodology**: **SIMPLE EDITS** — mechanical removals verified by grep + the full
  gate. No new tests needed (absence of usage is the safety argument, established by
  the greps in Step 1).
- **Planned at**: commit `f884f20`, 2026-09-03

## Why this matters

`featureRegistry.mts` exports seven feature-definition constants and a
`FeatureOptionsMap` type that nothing outside the file consumes. Dead exports on an
internal module are an invitation for coupling: any future consumer can import
`axesDef` directly and bypass the registry ordering that the architecture depends on.
Separately, the file declares a local `Dimensions` interface that is
character-for-character identical to `src/types/layoutTypes.mts`'s — two same-named
types describing the same concept drift apart eventually, and TS structural typing only
hides the rot until they don't match.

## Current state

- `src/chart/featureRegistry.mts` exports (line anchors pre-018):
  - `Dimensions` (`:25-31`) — duplicate of `src/types/layoutTypes.mts:2-8`:

```ts
// featureRegistry.mts:25-31
export interface Dimensions {
  readonly height: number;
  readonly innerHeight: number;
  readonly innerWidth: number;
  readonly margins: Margins;
  readonly width: number;
}
```

```ts
// src/types/layoutTypes.mts:2-8 — identical members
export interface Dimensions { readonly height: number; readonly innerHeight: number; readonly innerWidth: number; readonly margins: Margins; readonly width: number; }
```

  - `FeatureOptionsMap` (`:83-92`) — discriminated-union options map; repo-wide grep
    found ZERO consumers (src, tests, docs/api-reference).
  - `axesDef` (`:150`), `gridDef` (`:238`), `titleDef` (`:291`), `legendDef` (`:319`),
    `tooltipDef` (`:367`), `zoomPanDef` (`:409`), `customDef` (`:472`) — each referenced
    ONLY by the `FEATURE_REGISTRY` array (`:495-502`) in the same file.
- `src/index.mts:25` re-exports the `layoutTypes` `Dimensions` — the public type is
  unaffected by deleting the registry-local one.
- `src/chart/index.mts` (12 lines) does NOT re-export featureRegistry; `src/internal.mts`
  barrel re-exports `chart/index.mjs` — so the dead exports never reach either API
  surface, and removing `export` is not a semver-visible change.
- Verified NOT dead (do not touch): `CURVE_PRESETS`, `resolveCurve` — consumed at
  `src/chart/createChart.mts:92`, `src/components/line.mts:67`, and documented public
  API (`README.md:67`, `docs/api-reference.md:381`).

## Commands you will need

| Purpose   | Command          | Expected on success |
|-----------|------------------|---------------------|
| Typecheck | `pnpm type-check`| exit 0              |
| Tests     | `pnpm test`      | all pass            |
| Full gate | `pnpm check`     | exit 0              |

## Scope

**In scope**:
- `src/chart/featureRegistry.mts` (or the post-018 def files)

**Out of scope** (do NOT touch):
- `src/types/layoutTypes.mts` (it is the surviving source of truth — no edit needed)
- `src/index.mts`, `src/internal.mts`, `src/chart/index.mts`
- `CURVE_PRESETS` / `resolveCurve`
- Any behavior, any def's fields (a def losing its `export` keyword keeps all members)

## Git workflow

- Branch: `advisor/020-dead-export-cleanup`
- Commit: `refactor: drop dead featureRegistry exports and duplicate Dimensions`
- Do NOT push. Update `plans/README.md` row when done.

## Steps

### Step 1: Re-establish the usage facts (do not skip)

Run and record:

```sh
rg -n "FeatureOptionsMap" src/ docs/ README.md examples/     # expect: featureRegistry.mts only
rg -n "\b(axesDef|gridDef|titleDef|legendDef|tooltipDef|zoomPanDef|customDef|pointsDef)\b" src/ examples/   # expect: defs + FEATURE_REGISTRY in featureRegistry.mts (or post-018 files), nothing else
rg -n "Dimensions" src/chart/ src/types/                     # map every import site
```

If ANY hit is a real consumer outside the defining file (excluding prose in `docs/design/`
and `plans/`), that export is not dead — drop it from this plan and note it.

**Verify**: greps recorded; removal list confirmed.

### Step 2: Remove the dead exports

In `src/chart/featureRegistry.mts` (pre-018 layout):
1. Delete the `FeatureOptionsMap` type entirely (`:83-92`).
2. Remove the `export` keyword from the seven `const axesDef…customDef` declarations
   (they remain module-level consts consumed by `FEATURE_REGISTRY`).
3. Delete the local `Dimensions` interface (`:25-31`) and change in-file references to
   import it: `import type { Dimensions } from "@/types/layoutTypes.mjs";` (the file
   already imports `Margins` from `@/types/index.mjs` — either path that type-checks;
   prefer matching the existing import style in the file).

If 018 landed: apply the same three edits across the post-018 files (defs un-exported
in their own files, `FeatureOptionsMap` may already be gone, `Dimensions` import from
`featureContext.mjs` or `layoutTypes` per 018's convention).

**Verify**: `pnpm type-check` → exit 0.

### Step 3: Confirm nothing else broke

**Verify**: `pnpm check` → exit 0.

### Step 4: Bookkeeping

Update the 020 row in `plans/README.md` to DONE.

**Verify**: `git status` → only featureRegistry (or post-018 def files) + README changed.

## Test plan

- No new tests: the change is export-surface-only; compile + suite are the proof.
- Existing suite must remain 100% green — any failure means a "dead" export had a
  consumer (STOP).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm check` exits 0
- [ ] `rg -n "FeatureOptionsMap" src/` → zero matches
- [ ] `rg -n "interface Dimensions" src/` → exactly one match (`src/types/layoutTypes.mts`)
- [ ] `rg -n "export const \w+Def" src/chart/` → zero matches (defs are module-private)
- [ ] `git diff --stat` shows only the in-scope file(s) + `plans/README.md`
- [ ] `plans/README.md` status row updated to DONE

## STOP conditions

Stop and report back (do not improvise) if:

- Step 1 greps surface a live consumer of any listed export.
- `pnpm type-check` fails after removal with an import you cannot redirect to
  `layoutTypes.mjs` in one edit.
- You are tempted to also delete/rename anything not listed (e.g. `FeatureKey`,
  `FeatureDefinition`, `FEATURE_REGISTRY` — all alive; `pointsDef` naming is 018's job).

## Maintenance notes

- If docs (`docs/design/`, `docs/api-reference.md`) mention the individual defs or
  `FeatureOptionsMap`, they are prose describing internals — optional follow-up for the
  docs pass (plan 021 territory), not blocking here.
- After this lands, the module's public surface is exactly: `FEATURE_REGISTRY`,
  `FeatureDefinition`, `FeatureKey`, `FeatureRenderContext` (+ post-018 re-exports) —
  a reviewable contract.
