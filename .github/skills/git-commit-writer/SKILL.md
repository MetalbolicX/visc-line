---
name: 'git-commit-writer'
description: 'Generates standardized git commit messages following the conventional commits spec.
Use when user asks to "write a commit message", "help me commit", "summarize my changes",
"what should my commit say", or "draft a commit". Analyzes staged diffs and change
descriptions to produce type(scope): description format messages. Works in chat panels or via direct CLI piping.'
---

# Git Commit Message Writer

## Format

```
type(scope): short description

[optional body]

[optional footer]
```

Allowed types: feat, fix, docs, style, refactor, test, chore, perf, ci, build. For further details on types and formatting, see the [Conventional Commits Specification](references/git-conventions.md).

## Instructions

### Step 1: Get the diff

Run the next command:

```sh
#!/usr/bin/env bash
# Outputs the git diff for LLM analysis.

# Ensure we are inside a git repository
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
  echo "Error: Not a git repository. Please run this command from within a git repository."
  exit 1
fi

STAGED_DIFF=$(git diff --staged)

if [ -n "$STAGED_DIFF" ]; then
  echo "--- STAGED CHANGES ---"
  echo "$STAGED_DIFF"
else
  UNSTAGED_DIFF=$(git diff)
  if [ -n "$UNSTAGED_DIFF" ]; then
    echo "--- UNSTAGED CHANGES ---"
    echo "Note: These changes are not yet staged for commit."
    echo "$UNSTAGED_DIFF"
  else
    echo "No changes found. The working tree is clean."
  fi
fi

```

Read the output carefully. If the output states "No changes found" or "Not a git repository", halt the process and inform the user.

### Step 2: Analyze the changes

Review the diff output and determine:

- **Scope & Impact**: What files changed, and what architectural domain or module do they belong to?
- **Type**: Does this add functionality (`feat`), resolve an issue (`fix`), restructure code without changing behavior (refactor), or update tooling/documentation (`chore`/`docs`)?
- **Core Intent**: What is the single most important change occurring in this diff?

### Step 3: Write the message

Draft the commit message adhering to these constraints:

- Keep the subject line strictly under 72 characters.
- Use the imperative mood in the subject line (e.g., "add feature", not "added feature" or "adds feature").
- Do not end the subject line with a period.
- Include a body if the why or how of the change requires more context than the subject line allows. Wrap body lines at 72 characters.
- Use the footer to reference external trackers, issues, or breaking changes (e.g., `Closes #123`, `BREAKING CHANGE: ...`).

### Step 4: Output the Final Command

Construct the final git command using the generated message. **Do not execute this command yourself**. You must output it inside a bash code block so the user can review and run it manually.

If your message includes a body or footer, format the command using multiple `-m` flags or a multiline string.

Example output format:

```sh
git commit -m "feat(auth): add OAuth2 login with Google" -m "Implements Google OAuth2 flow using the existing session management system. Users can now sign in with their Google account." -m "Closes #142"
```

## Quality Check (Internal)

Before outputting, ensure:

- [ ] Type is strictly one of the allowed types.
- [ ] Subject line is under 72 characters and uses imperative mood.
- [ ] Scope is specific, lowercase, and concise.
- [ ] The final output is exclusively a git commit command block for the user to run.
