# Plan 031: Release hygiene — run-mode tests, enforced coverage, blocking lint

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat ca94562..HEAD -- package.json .github/workflows/ci.yml vitest.config.mts plans/README.md`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW (config-only; the one real risk is the coverage gate —
  see Step 3's STOP condition)
- **Depends on**: none — but land LAST in Round 5, after the feature plans,
  so the coverage gate measures the final suite
- **Category**: dx / tests
- **Planned at**: commit `ca94562`, 2026-09-04
- **Methodology**: simple edits with verification per edit.

## Why this matters

Three release gates are currently decorative. (1) `pnpm test` runs Vitest in
**watch mode** (`package.json:13`), so the `check` and `prepublishOnly`
scripts hang forever on non-TTY environments — a publish pipeline that can't
complete is not a gate. (2) Coverage thresholds exist
(`vitest.config.mts:33-37`: branches 79, functions 89, lines 87) but no
script or CI step ever passes `--coverage` — the gate is silently vacuous.
(3) The CI lint job has `continue-on-error: true`
(`.github/workflows/ci.yml:46`), so `--max-warnings=0` never blocks anything.
None of these require new code; all three must be real before this library is
tagged.

## Current state

Facts verified verbatim at `ca94562`.

### package.json scripts (`:6-17`)

```json
    "lint": "eslint . --max-warnings=0",
    "type-check": "tsc --noEmit",
    "build": "tsdown",
    "test": "vitest",
    "check": "pnpm type-check && pnpm test && pnpm build && pnpm lint",
    "prepublishOnly": "pnpm type-check && pnpm test && pnpm build"
```

`"test": "vitest"` = watch mode. Verified green non-watch equivalent at
`ca94562`: `pnpm exec vitest run` → 31 files / 429 tests passed, exit 0
(~193s). The old `.mjs`/`.mts` `ERR_LOAD_URL` failure is FIXED by the
`mjsToMtsPlugin` (`vitest.config.mts:7-20`) — the stale note in
`plans/README.md` "Known verification blockers" must be corrected (Step 4).

### vitest.config.mts coverage block (`:27-38`)

```ts
  test: {
    coverage: {
      exclude: ["src/**/*.test.mts"],
      include: ["src/**/*.mts"],
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        branches: 79,
        functions: 89,
        lines: 87,
      },
    },
```

`@vitest/coverage-v8` is already a devDependency (`package.json:46`) — no
install needed.

### ci.yml lint job (`:42-46`)

```yaml
  lint:
    name: lint
    runs-on: ubuntu-latest
    timeout-minutes: 10
    continue-on-error: true
```

The `ci` job's Test step runs `pnpm test` (`ci.yml:37`) — on GitHub's
non-TTY runners watch mode would hang until the 10-minute job timeout kills
it. (Whether it currently hangs or Vitest detects CI and runs once, the
correct configuration is explicit `run` — do not rely on detection heuristics.)

## Commands you will need

| Purpose            | Command                              | Expected on success        |
|--------------------|--------------------------------------|----------------------------|
| Tests (run mode)   | `pnpm exec vitest run`               | all pass, exit 0           |
| Tests + coverage   | `pnpm exec vitest run --coverage`    | all pass + thresholds met  |
| Lint               | `pnpm lint`                          | exit 0                     |
| Full gate          | `pnpm check`                         | exit 0 (post-fix)          |

Coverage run takes longer than the plain suite (~190s); pass a shell timeout
of at least 300000 ms.

## Scope

**In scope** (the only files you should modify):

- `package.json` — script edits only
- `.github/workflows/ci.yml` — coverage step + lint gate
- `plans/README.md` — correct the stale "Known verification blockers" section

**Out of scope**:

- `vitest.config.mts` threshold VALUES (do not tune them in this plan —
  see STOP conditions).
- Source code, test files, docs content.
- Wiring the e2e harness into CI (explicitly deferred — Alpine/CDP recipe is
  not ubuntu-CI-ready; see `tests/e2e/README.md:303-318`).

## Git workflow

- Branch: `advisor/031-release-hygiene`
- Commits: conventional, e.g. `build: run vitest in run mode`,
  `ci: enforce coverage thresholds and blocking lint`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Run-mode test script

`package.json`: change `"test": "vitest"` → `"test": "vitest run"`.
`check` and `prepublishOnly` already call `pnpm test` — they inherit the fix
unchanged.

**Verify**: `pnpm test` → runs once, all pass, exits 0 (does NOT hang).
`pnpm check` → exit 0.

### Step 2: Blocking lint in CI

`.github/workflows/ci.yml`: delete the line `continue-on-error: true` from
the lint job.

**Verify**: `git diff .github/workflows/ci.yml` shows exactly one deleted
line. (YAML validity: `npx yaml-lint` is NOT available — instead eyeball the
diff and rely on GitHub's parser at push time; locally `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))"` → no exception.)

### Step 3: Coverage gate in CI

Add to the `ci` job, after the Test step:

```yaml
      - name: Coverage
        run: pnpm exec vitest run --coverage
```

Then run it LOCALLY first: `pnpm exec vitest run --coverage` must exit 0
with all three thresholds met.

**STOP CONDITION**: if the coverage run FAILS against the existing
thresholds, do NOT lower them and do NOT add the CI step. Report the actual
numbers; the decision to tune thresholds vs. write tests belongs to the
owner. Complete Steps 1, 2, 4 and mark this step BLOCKED in the index.

**Verify**: local coverage run exits 0; CI YAML contains the new step.

### Step 4: Correct the stale blocker note

`plans/README.md` "Known verification blockers" section (lines ~99-106):
the `ERR_LOAD_URL` claim is stale — `pnpm exec vitest run` passes 429/429 at
`ca94562` thanks to `vitest.config.mts:7-20` (`mjsToMtsPlugin`). Rewrite the
section to state: (a) the loader issue is fixed; (b) the watch-mode script
issue is fixed by this plan; (c) the remaining manual-only layer is the
browser e2e harness (not wired to CI by design).

**Verify**: the section no longer describes `ERR_LOAD_URL` as live.

## Test plan

- No new tests. Verification is the gates themselves:
  `pnpm check` → exit 0; `pnpm exec vitest run --coverage` → exit 0 with
  thresholds met; CI YAML parses.

## Done criteria

- [ ] `pnpm test` exits 0 in non-TTY mode (no watch hang)
- [ ] `pnpm check` exits 0 end-to-end
- [ ] `continue-on-error` absent from the lint job
- [ ] CI has a Coverage step running `pnpm exec vitest run --coverage` — OR the
      step is documented BLOCKED with real coverage numbers in the report
- [ ] `plans/README.md` blocker section reflects current reality
- [ ] No threshold values changed; no source/test files modified
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `pnpm exec vitest run` is not green at the starting commit (something
  regressed since `ca94562` — report, do not fix).
- Coverage fails the existing thresholds (see Step 3).
- The lint job fails once `continue-on-error` is removed (report the lint
  errors; do not fix source — that would be scope creep).

## Maintenance notes

- After this lands, `pnpm check` is the single local gate and CI enforces
  type-check + tests + coverage + build + blocking lint on every push/PR.
- A reviewer should scrutinize: that no threshold was quietly lowered, and
  that the coverage step runs the FULL suite (not a filtered subset).
- Deferred: wiring the manual browser e2e layer into CI — requires a
  glibc-runner-compatible Chromium strategy; owner decision.
