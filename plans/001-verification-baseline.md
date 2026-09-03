# Plan 001: Add a one-command verification baseline (`pnpm check` + GitHub Actions CI)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 5860f3e..HEAD -- package.json .github/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/003-tipviz-v3-migration.md
- **Category**: dx
- **Planned at**: commit `5860f3e`, 2026-09-01

## Why this matters

The repo has three verification commands (`pnpm type-check`, `pnpm test`,
`pnpm build`) but no single command that runs them all, no CI, and a `lint`
script that is a vacuous `echo` (exit 0, no work). Nothing prevents broken
code from being committed or published except `prepublishOnly`, which only
runs at publish time. Every other plan in `plans/` changes source code;
this plan is the safety net that makes those changes verifiable with one
command locally and automatically on every push/PR.

## Current state

- `package.json:8` — `"lint": "echo 'ESLint is temporarily disabled — requires type-aware linting setup. Run type-check and test instead.'"` (returns exit 0; do NOT remove in this plan — lint restoration is plan 011).
- `package.json:15` — `"prepublishOnly": "pnpm type-check && pnpm test && pnpm build"` (the only place the three commands are chained).
- No `.github/` directory exists (verified at planning time).
- Package manager: pnpm (11.25.0 locally). Check whether `package.json` has a `"packageManager"` field; if absent, this plan adds one.
- Sibling project `/home/metalbolicx/Documents/tipviz` has a working CI at `.github/workflows/ci.yml` (push + PR, pnpm via `pnpm/action-setup`, `install --frozen-lockfile`, typecheck → test:cov → lint with `continue-on-error`). Borrow that shape; visc-line has no lint yet, so omit the lint job.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `pnpm install`           | exit 0              |
| Typecheck | `pnpm type-check`        | exit 0, no errors   |
| Tests     | `pnpm test`              | all pass            |
| Build     | `pnpm build`             | exit 0, dist/ produced |
| New check | `pnpm check`             | all three pass      |

Note: `pnpm test` and `pnpm type-check` must already pass before you start.
If they do not, STOP and report — the baseline is broken before we add CI.

## Scope

**In scope** (the only files you should modify or create):
- `package.json` (scripts block + `packageManager` field only)
- `.github/workflows/ci.yml` (create)

**Out of scope** (do NOT touch):
- `eslint` config or the `lint` script (plan 011)
- `vitest.config.mts`, `tsdown.config.mjs`, any `src/` file
- `pnpm-lock.yaml` will change as a side effect only if `packageManager` is added — commit it if so.

## Git workflow

- Branch: `advisor/001-verification-baseline`
- Commit style: conventional commits, e.g. `ci: add pnpm check script and GitHub Actions workflow` (repo uses `fix:`, `chore:`, `refactor:` prefixes — see `git log --oneline`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add the `check` script and `packageManager` field

In `package.json` `"scripts"`, add:

```json
"check": "pnpm type-check && pnpm test && pnpm build"
```

If no `"packageManager"` field exists at the top level, add
`"packageManager": "pnpm@11.25.0"` (matches the local toolchain; keeps CI
and local installs identical).

**Verify**: `pnpm check` → type-check, tests, and build all pass (exit 0).

### Step 2: Create the CI workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: ["**"]
  pull_request:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 11.25.0
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm check
```

**Verify**: `test -f .github/workflows/ci.yml && python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/ci.yml'))" && echo VALID` → `VALID`
(If python3/yaml is unavailable, `pnpm exec js-yaml .github/workflows/ci.yml > /dev/null && echo VALID`.)

### Step 3: Run the full baseline once more

**Verify**: `pnpm check` → exit 0. Then `git status` → only `package.json`, `pnpm-lock.yaml` (if changed), `.github/workflows/ci.yml`, and `plans/README.md` modified.

## Test plan

No new unit tests — this plan adds infrastructure. The CI workflow itself is
verified on first push to GitHub (out of scope here; the operator pushes).

## Done criteria

- [ ] `pnpm check` exits 0
- [ ] `.github/workflows/ci.yml` exists and parses as valid YAML
- [ ] `package.json` has a `check` script and a `packageManager` field
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- `pnpm type-check` or `pnpm test` fails BEFORE you change anything — the baseline is already broken; report instead of building CI on sand. If the failure is `tooltip.setHtml is not a function` (or any tooltip-related error), plan 003 must land first; update the index/PR accordingly and stop.
- `pnpm build` fails locally — same reason.
- `pnpm-lock.yaml` changes for any reason other than the `packageManager` field addition.

## Maintenance notes

- When plan 011 (lint restore) lands, add `pnpm lint` to `check` and a lint job (with `continue-on-error: true` initially, as tipviz does) to CI.
- When plan 010 (browser e2e) lands, decide whether e2e belongs in CI (needs a Chromium download step).
