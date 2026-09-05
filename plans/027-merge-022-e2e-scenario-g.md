# Plan 027: Merge feature/022-reference-lines-annotations to main + e2e scenario G

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git log --oneline ca94562..HEAD` and
> `git branch -a --contains 383bf39`. If main has moved beyond `ca94562` or
> commit `383bf39` no longer exists on `feature/022-reference-lines-annotations`,
> treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: MED (git merge + browser verification)
- **Depends on**: none — but land AFTER 024/025/026 if they are ready, so the
  merged main gets one clean `pnpm check` run; may also land first if the
  owner wants the features on main immediately
- **Category**: feature (merge + verification of already-built work)
- **Planned at**: commit `ca94562`, 2026-09-04

## Why this matters

Plan 022's work (data-anchored reference lines + annotations — the core
"storytelling with data" explanatory layer) is complete and green on branch
`feature/022-reference-lines-annotations` (squashed commit `383bf39`,
447/447 tests + type-check + lint + build at merge time), but it was never
merged: `main` at `ca94562` contains zero reference-line/annotation code
(grep `withReferenceLines|withAnnotations|referenceLine|annotation` in
`src/` → no matches) while `plans/README.md:37` marks 022 DONE. A feature
that exists only on a side branch does not exist for consumers. This plan
merges it and adds the browser e2e scenario that plan 023's maintenance
notes explicitly deferred.

## Current state

Facts verified at `ca94562`.

- **main**: `ca94562`, clean tree, 4 commits ahead of `origin/main`
  (`cccaa7c` e2e rewire, `c47e3be`, `8a6f79a`, `ca94562` gitignore/docs).
- **feature branch**: `feature/022-reference-lines-annotations` @ `383bf39`,
  branched from `42b5d56`. Main's 4 newer commits touch `tests/e2e/*`,
  `plans/README.md`, `.gitignore`, `docs/` — the only likely conflict is
  `plans/README.md` (both sides edited it).
- **The 022 diff**: 18 files / +1112 / -11 — new
  `src/components/referenceLines.mts`, `src/components/annotations.mts`,
  `src/chart/featureDefs/referenceLines.mts`,
  `src/chart/featureDefs/annotations.mts`, registry/order updates, tests, and
  `docs/api-reference.md` + `AGENTS.md` updates. Registry order after merge
  (per 022):
  `axes → grid → referenceLines → title → legend → tooltip → zoomPan → custom → annotations → points`
- **e2e harness**: `tests/e2e/harness.html` + `tests/e2e/README.md` define
  scenarios A–F driven manually via `playwright-cli` CDP attach:
  - A full render, B minimal render, C empty-data guard, D tooltip hover,
    E zoom re-render, F update()/dispose()
  - README `:332-336` records "add reference lines/annotations scenario after
    022 merges" as the documented next step.
  - Driver recipe (Alpine/musl — playwright's own Chromium is glibc-only):
    launch system Chromium with
    `/usr/bin/chromium --headless=new --no-sandbox --disable-gpu --remote-debugging-port=9222`
    plus env `DBUS_SESSION_BUS_ADDRESS=disabled:` and
    `XDG_RUNTIME_DIR=/tmp`, then `playwright-cli -s=cdp attach --cdp=http://127.0.0.1:9222`.
    Serve the repo root with `python3 -m http.server 8742` (see
    `tests/e2e/README.md` "Verification Commands" for the exact sequence).
    Full details: `tests/e2e/README.md:9-44`.
  - IMPORTANT environment notes (from plan 023 execution): `pkill` hangs on
    this system — kill via `kill -9 $(ps aux | grep ...)`; `dispose()`
    intentionally leaves the SVG in the DOM.

## Commands you will need

| Purpose        | Command                                  | Expected on success      |
|----------------|------------------------------------------|--------------------------|
| Typecheck      | `pnpm type-check`                        | exit 0                   |
| Tests          | `pnpm exec vitest run`                   | all pass                 |
| Lint           | `pnpm lint`                              | exit 0                   |
| Build          | `pnpm build`                             | exit 0                   |
| e2e harness    | see `tests/e2e/README.md` recipe         | scenarios A–G pass       |

Do NOT use bare `pnpm test` (watch mode hangs on non-TTY). Full suite ~200s
post-merge — pass a shell timeout of at least 300000 ms.

## Scope

**In scope**:

- Git merge of `feature/022-reference-lines-annotations` into `main`
  (including resolving the expected `plans/README.md` conflict — keep BOTH
  sides' rows; 022's row stays DONE, 023's row stays DONE, Round 5 rows stay).
- `tests/e2e/harness.html` — add a chart instance exercising
  `withReferenceLines` + `withAnnotations`.
- `tests/e2e/README.md` — add Scenario G with commands and a Live-Verified
  Outputs row.
- `plans/README.md` — this plan's row; add "merged to main by plan 027" to
  022's dependency notes if a note field is touched anyway.

**Out of scope**:

- Any `src/` changes. If the merge reveals real breakage in `src/`, that is a
  STOP condition, not an invitation to fix.
- Pushing to `origin` (operator decision).
- Wiring e2e into CI (explicitly deferred by plan 023).
- Deleting the feature branch (operator decision, per prior merges the owner
  prefers to request this explicitly).

## Git workflow

- Work directly on `main` for the merge (this is the established pattern:
  prior rounds merged advisor branches into main at the owner's request).
- Confirm with the operator before running the merge if they have not already
  approved it in the dispatching instruction.
- Merge style: prior rounds used merges of feature branches into main
  (e.g. `107bc0d`, `42b5d56`). Use a regular merge commit
  (`git merge --no-ff feature/022-reference-lines-annotations`) so the branch
  point stays visible.

## Steps

### Step 1: Pre-merge verification of the feature branch

```bash
git log --oneline -3 feature/022-reference-lines-annotations
git diff --stat 42b5d56..feature/022-reference-lines-annotations
```

**Verify**: tip is `383bf39`; diff touches the 18 files listed in "Current
state" and nothing else.

### Step 2: Merge

```bash
git checkout main && git merge --no-ff feature/022-reference-lines-annotations
```

Resolve the expected `plans/README.md` conflict by keeping both sides' rows
(each round's section is additive; no row is deleted on either side).

**Verify**: `git status` → clean; `git log --oneline -2` shows the merge
commit on top of `ca94562`.

### Step 3: Post-merge gate

```bash
pnpm install && pnpm type-check && pnpm exec vitest run && pnpm lint && pnpm build
```

**Verify**: every command exits 0; test count is ≥ 447 (022's suite) plus
any tests landed on main since.

### Step 4: e2e Scenario G — reference lines + annotations in a real browser

1. In `tests/e2e/harness.html`, add a new chart container (e.g.
   `#chart-annotated`) built via UMD `ViscLine.createChart` with
   `withReferenceLines` (one horizontal target line with label) and
   `withAnnotations` (one callout on a data point), retaining the instance in
   the `__charts` registry like the existing fixtures.
2. Run the harness per `tests/e2e/README.md`'s recipe (system Chromium + CDP
   attach + `python3 -m http.server 8742`).
3. Scenario G assertions (via `playwright-cli -s=cdp eval`):
   - the reference-line SVG node(s) exist with the expected count
     (check the component's actual class names post-merge — read
     `src/components/referenceLines.mts` after Step 2);
   - the annotation text node exists and its text matches the fixture;
   - after a wheel-zoom on that chart (mirror Scenario E's technique), the
     reference line's y position changed — proving data-anchored zoom
     participation;
   - no page errors (`err:null`).
4. Append Scenario G to `tests/e2e/README.md`: commands in the same style as
   A–F, plus a row in the "Live-Verified Outputs" table with the REAL
   recorded values (never invent expected values — record what the live run
   produced, as plan 023 did).

**Verify**: all recorded assertions show the expected PASS values in the
README table.

### Step 5: Index update

Update this plan's row in `plans/README.md` to DONE.

**Verify**: `git diff --stat` shows only the in-scope files.

## Test plan

- The merged 022 unit/integration suite (already written, 447 tests) is the
  primary guard — Step 3 runs it on merged main.
- New verification is browser-level only (Scenario G); no new Vitest files.
- Verification: Step 3 all green + Scenario G PASS row recorded with live
  values.

## Done criteria

- [ ] `git log main` contains merge of `383bf39`
- [ ] `grep -rn "withReferenceLines" src/` returns matches
- [ ] `pnpm type-check`, `pnpm exec vitest run`, `pnpm lint`, `pnpm build` all exit 0 on merged main
- [ ] `tests/e2e/README.md` has Scenario G with commands + Live-Verified Outputs row (real values)
- [ ] No `src/` files modified by this plan (`git diff 383bf39..main --stat -- src/` shows only what the merge itself brought)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `feature/022-reference-lines-annotations` is missing or its tip is not
  `383bf39`.
- The merge produces conflicts beyond `plans/README.md`.
- Post-merge `pnpm exec vitest run` fails (the branch was green pre-merge;
  a failure means main moved in an incompatible way — report the failure,
  do not patch `src/`).
- The harness cannot be driven because system Chromium or playwright-cli is
  unavailable in the execution environment (in that case complete Steps 1–3
  and 5, mark Scenario G as BLOCKED with the reason in the README, and
  report).

## Maintenance notes

- After merge, `AGENTS.md`'s registry-order line must match the live
  `FEATURE_REGISTRY` order (022 updated it on the branch; confirm it
  survived the merge).
- The operator may want the 4 unpushed main commits + this merge pushed
  together; that is their call, not this plan's.
- Plan 030 (end-of-line labels) will extend this same harness with its own
  scenario — follow the pattern established here.
