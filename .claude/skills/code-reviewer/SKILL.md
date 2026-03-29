---
name: 'code-reviewer'
description: 'Conducts structured code reviews with categorized feedback. Use when user asks
to "review this code", "check my PR", "look over this function", or "give me feedback on
this implementation". Produces structured output with blocking issues separate from suggestions.'
---

# Code Reviewer

## Purpose

Provide disciplined, structured feedback on code changes so developers can quickly triage high-risk problems, next-step improvements, and preservation of progress.

## Review Process

### 1. Confirm context

- Identify the goal of the change: `feature`, `fix`, `refactor`, or `cleanup`.
- Note the language, framework, and any architectural boundaries affected by the diff.
- Capture the expected user or system behavior so you can judge correctness.

### 2. Evaluate against the criteria

- Use [criteria](references/criteria.md) as the checklist for the following categories in order: Correctness, Security, Stability/Resilience, Performance/Scalability, Maintainability/Readability, Testing, Documentation, and UX/Accessibility where applicable.
- Treat each category as untouchable—even if the diff is small, scan for regressions or missing coverage in every area.
- When the diff touches behavior, prioritize reproducible concern reproduction steps and cite line ranges when raising issues.

### 3. Compose severity-aware findings

- Classify anything that results in incorrect behavior, vulnerabilities, data/asset loss, or crashes as a Blocking Issue; these need remediation before merge.
- Record all other improvements (edge-case handling, cleanup, naming, logs, clarity, missing tests) as Suggestions.
- For each finding, note the location, the why, and a concrete how to fix; reference files/line ranges if deterministic.
- If a change introduces risk but has adequate tests or mitigations, document it as a Suggestion with a verification step rather than blocking.

## Reporting Format

```
## Summary
- 2–3 sentences covering overall correctness, notable strengths, and whether the change is ready to merge.

## Blocking Issues
1. [Describe issue, why it blocks, how to reproduce/fix.]
2. ... (If none, write "None found.")

## Suggestions
1. [Detail lower-severity improvement and suggested fix or reference.
2. ...]

## Positive Notes
1. [Call out something the change handles well (tests added, clear naming, solid docs, etc).]
```

## Optional Follow-up

- After delivering feedback, note any required verification (tests to run, manual UI steps, etc.).
- If the diff is large, highlight areas that still need deeper exploration (e.g., "Security review pending for X").
