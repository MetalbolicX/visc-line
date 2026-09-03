# Plan 011: Restore a working lint setup with flat config (borrowed from tipviz)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 5860f3e..HEAD -- package.json eslint.config.* .github/workflows/ci.yml`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: LOW
- **Depends on**: plans/001-verification-baseline.md (CI exists to host the lint job)
- **Category**: dx
- **Planned at**: commit `5860f3e`, 2026-09-01

## Why this matters

`pnpm lint` is a vacuous `echo` returning exit 0 — it guards nothing, and
the message says "temporarily". Meanwhile all the lint plugins are ALREADY
devDependencies (typescript-eslint, eslint-plugin-functional, -perfectionist,
-unicorn, @eslint/js) — the work was started and abandoned. The sibling
project tipviz has a working flat config with exactly this plugin family
and a dual-TypeScript quirk documented in its AGENTS.md. This plan ports
that setup, turns the placeholder into a real command, and wires it (non-
blocking) into CI.

## Current state

- `package.json:8` — `"lint": "echo 'ESLint is temporarily disabled — requires type-aware linting setup. Run type-check and test instead.'"`.
- devDeps present: `eslint` `^10.9.1`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-functional`, `eslint-plugin-perfectionist`, `eslint-plugin-unicorn` (verify exact versions with `pnpm list` before configuring).
- NO `eslint.config.*` file exists.
- tipviz reference (READ and port): `/home/metalbolicx/Documents/tipviz/eslint.config.mjs` — flat config with typescript-eslint, unicorn, perfectionist, jsdoc plugins; a global `no-restricted-properties` ban on `innerHTML` with one documented scoped disable. Their `.github/workflows/ci.yml` runs lint with `continue-on-error: true`.
- tipviz quirk to CHECK before porting: they alias `typescript` to `@typescript/typescript6` for the eslint parser while using `@typescript/native` (TS 7, Go tsc) for typecheck/build (`tipviz/AGENTS.md:42`). visc-line's `package.json` devDeps must be inspected for the same split — if visc-line type-checks with `@typescript/native`, the eslint parser needs a compatible `typescript` package.
- visc-line tsconfig: strict, `noUnusedLocals`, `noImplicitAny`, paths `@/*` → `./src/*`.

## Commands you will need

| Purpose   | Command | Expected on success |
|-----------|---------|---------------------|
| Install   | `pnpm install` | exit 0 |
| Lint      | `pnpm lint` | exit 0 after autofix + rule tuning |
| Typecheck | `pnpm type-check` | exit 0 |
| Tests     | `pnpm test` | all pass |

## Scope

**In scope**:
- `eslint.config.mjs` (create)
- `package.json` (lint/lint:fix scripts; possibly devDp adjustments the parser needs)
- `.github/workflows/ci.yml` (add non-blocking lint job)
- Source files ONLY for `pnpm lint:fix` mechanical fixes (import ordering, style) — no logic edits; `git diff` must show formatting-only changes there.

**Out of scope**:
- Any behavioral change to `src/` — if a lint rule demands a logic change, disable that rule for the file with an `eslint-disable-next-line` + comment instead.
- `tsconfig.json`, build config, docs.

## Git workflow

- Branch: `advisor/011-lint-restore`
- Commit 1: `chore: add flat eslint config and real lint scripts`. Commit 2: `style: apply lint autofixes`. Commit 3: `ci: run lint non-blocking in CI`.
- Do NOT push unless instructed.

## Steps

### Step 1: Port the flat config

Create `eslint.config.mjs` based on tipviz's (adapt paths): typescript-eslint
with type-aware `recommendedTypeChecked` (the "requires type-aware linting
setup" the placeholder begged for), unicorn, perfectionist, functional
plugins. Add ignores: `dist/`, `docs/`, `coverage/`, `examples/` (Vite demo
can be linted later), `**/*.test.mts` may keep type-aware rules but relax
perfectionist ordering if noisy. Match visc-line conventions: functional
patterns, camelCase, `is/has/can/should` booleans — encode as rules where
plugins support them, not comments.

**Verify**: `pnpm exec eslint . --max-warnings=0` runs (even if it reports violations at this point — Step 2 handles them).

### Step 2: Replace the placeholder script and clear violations

`package.json`: `"lint": "eslint ."`, keep `"lint:fix": "eslint . --fix"`.
Run `pnpm lint:fix`; for remaining violations choose per-case: autofix /
rule-tune (if the rule fights a deliberate repo convention) /
`eslint-disable-next-line` with a one-line reason (tipviz's innerHTML
scoped-disable is the model). Target: `pnpm lint` exits 0 with
`--max-warnings=0`.

**Verify**: `pnpm lint` → exit 0. `git diff src/` → mechanical/fix-only changes.

### Step 3: Add lint to check + CI (non-blocking first)

1. Append `&& pnpm lint` to the `check` script from plan 001.
2. In `.github/workflows/ci.yml`, add a separate `lint` job with `continue-on-error: true` (tipviz's pattern) so lint churn cannot block merges while the config beds in.

**Verify**: `pnpm check` → exit 0 including lint. CI YAML still parses (plan 001's validation command).

### Step 4: Full regression

**Verify**: `pnpm check` → exit 0; `pnpm test` → all pass.

## Test plan

No unit tests. Verification is the commands above plus the diff review: no logic changes in `src/`.

## Done criteria

- [ ] `pnpm lint` exits 0 (real ESLint run, no echo)
- [ ] `eslint.config.mjs` exists with type-aware typescript-eslint
- [ ] `pnpm check` includes lint and exits 0
- [ ] CI has a non-blocking lint job
- [ ] `git diff src/` contains only mechanical fixes or eslint-disable comments
- [ ] `plans/README.md` status row updated

## STOP conditions

- Making lint pass requires a LOGIC change in `src/` — stop; disable the rule with a comment and report which rule/file.
- The eslint parser cannot resolve the repo's TypeScript version (the tipviz dual-TS quirk) after 2 configuration attempts — report the exact version conflict; do not start swapping the repo's typescript packages.
- `lint:fix` rewrites more than ~200 lines of `src/` — report the scale before committing (large mechanical diffs bury review).

## Maintenance notes

- After ~2 weeks of stability, flip CI lint to blocking (`continue-on-error: false`) — remove that flag deliberately, not accidentally.
- AGENTS.md's "Dev Commands" section should be updated to reflect that `pnpm lint` is real now (one-line doc touch included in this plan's spirit; do it in the same PR).
