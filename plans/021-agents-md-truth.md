# Plan 021: Make AGENTS.md match the real architecture

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat f884f20..HEAD -- AGENTS.md`
> On any change, compare "Current state" excerpts against the live file; STOP on mismatch.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: NONE (docs only)
- **Depends on**: plans/018-registry-decomposition.md (this plan documents the
  POST-018 architecture; if 018 is rejected or long-blocked, adjust Step 2 to document
  today's layout instead and drop the 018-dependent bullets)
- **Category**: docs
- **Methodology**: **SIMPLE EDITS** — documentation truth-sync. Every claim added must
  be verified against live code with the greps in Step 1 before writing it.
- **Planned at**: commit `f884f20`, 2026-09-03

## Why this matters

AGENTS.md is the instruction sheet every coding agent (and new contributor) reads
before touching this repo. It currently omits the entire `src/chart/` directory — 9
files, ~2,100 lines including the registry that AGENTS.md itself calls "important" —
and describes renderLine as "hardcoded — NOT in registry", which 018 changes. Wrong
maps produce wrong navigation: an agent following the current doc would look for
render flow logic in directories that don't contain it.

## Current state

- `AGENTS.md` (repo root), section "Architecture", currently lists source dirs:
  `components/`, `services/`, `interactivity/`, `types/`, `utils/`, `themes/`,
  `accessibility/` — `src/chart/` is missing entirely despite containing
  `createChart.mts` (the entry), `chartRender.mts` (the render flow), `featureRegistry.mts`
  (the registry the doc's "Render Flow (important)" section depends on), `chartState.mts`,
  `chartLifecycle.mts`, `chartTypes.mts`, `chartConstants.mts`, `chart/index.mts`.
- "Render Flow (important)" step 4 says: "`renderLine` (hardcoded — NOT in registry)".
  Step 5 lists registry order "axes → grid → title → legend → tooltip → zoomPan →
  custom → points" — verify still true post-018.
- "Adding a new feature" bullet references the registry pattern; post-018 the def files
  live separately — the bullet's file target changes.
- Also undocumented: second entry point `src/internal.mts` (`./internal` package export)
  and the `pnpm check` aggregate command (scripts section of AGENTS.md lists individual
  commands only).

## Commands you will need

| Purpose     | Command                          | Expected on success |
|-------------|----------------------------------|---------------------|
| Verify tree | `ls src/chart/`                  | matches doc claims  |
| Verify flow | `rg -n "FEATURE_REGISTRY|renderLine" src/chart/chartRender.mts src/chart/zoomDispatch.mts` | anchors match doc |
| Full gate   | `pnpm check`                     | exit 0 (docs change nothing, run once to be safe) |

## Scope

**In scope**:
- `AGENTS.md`

**Out of scope**:
- `README.md`, `docs/**` (separate docs pass if wanted)
- Any source file
- Changing any behavior

## Git workflow

- Branch: `advisor/021-agents-md-truth`
- Commit: `docs: sync AGENTS.md architecture with post-018 layout`
- Do NOT push. Update `plans/README.md` row when done.

## Steps

### Step 1: Verify every claim you are about to write

Run:

```sh
ls src/chart/                                   # actual file list
rg -n "FEATURE_REGISTRY" src/ --type-add 'mts:*.mts' -t mts   # who consumes the registry now
rg -n "renderLine" src/chart/                   # call sites post-018 (expect the shared helper)
node -e "console.log(Object.keys(require('./package.json').scripts).join(' '))"  # script list incl. check
```

Record the answers; every sentence in Step 2 must trace to one of them.

**Verify**: answers recorded.

### Step 2: Update AGENTS.md

1. **Architecture / Source dirs**: add `chart/` (first, since it holds the entry) with a
   one-liner: entry point, render flow, feature registry, state/lifecycle, chart types.
2. **Architecture / Entry**: `src/index.mts` + note the second entry `src/internal.mts`
   (package export `./internal`).
3. **Render Flow step 4**: replace "`renderLine` (hardcoded — NOT in registry)" with the
   post-018 truth (expected: "line redraw lives in the shared `redrawLine` helper used
   by render flow and zoom dispatch" — write what Step 1 verified, not what this plan
   predicted).
4. **Render Flow step 5**: re-verify registry order and the zoom-participation set;
   update the "Zoom path" subsection to name the new dispatch home
   (e.g. `src/chart/zoomDispatch.mts`) if 018 landed.
5. **Adding a new feature**: point at the post-018 def-file location instead of
   "add one entry to FEATURE_REGISTRY" if the mechanics changed.
6. **Dev Commands**: add `pnpm check` (type-check → test → build → lint) to the command
   list if still absent.

Keep the existing terse style (tables/code blocks, no prose bloat).

**Verify**: `rg -n "chart/" AGENTS.md` → present in Source dirs; `rg -n "NOT in registry" AGENTS.md` → zero matches (or accurately reflects reality if 018 didn't land).

### Step 3: Sanity + bookkeeping

**Verify**: `pnpm check` → exit 0 (unchanged). Update the 021 row in `plans/README.md`
to DONE.

## Test plan

- Documentation-only: the "tests" are the Step 1 greps and Step 2 verify greps. No vitest changes.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `rg -n "src/chart|chart/" AGENTS.md` → the chart dir is documented
- [ ] Every file listed in the doc's architecture section exists (`ls` each)
- [ ] No claim in "Render Flow" contradicts `rg` evidence gathered in Step 1
- [ ] `pnpm check` exits 0
- [ ] Only `AGENTS.md` + `plans/README.md` modified (`git status`)
- [ ] `plans/README.md` status row updated to DONE

## STOP conditions

Stop and report back (do not improvise) if:

- Plan 018's final architecture differs from what this plan predicted AND the delta
  cannot be resolved by writing what Step 1's greps show (e.g. registry deleted
  outright — then surface the design change before documenting).
- You find additional undocumented entry points or scripts — add them (in scope
  spirit), but STOP if you find a THIRD package export beyond `.` and `./internal`.

## Maintenance notes

- Any future architecture plan should budget a matching AGENTS.md edit as its final
  step — this plan exists because that practice lapsed.
- Reviewers: one skim against `ls src/chart/` and the render flow section is enough;
  the risk here is drift, not breakage.
