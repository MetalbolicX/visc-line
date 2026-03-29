---
description: 'Guidelines for high-performance, functional, and clean Python code.'
paths:
  - '**/*.py'
---
# Python Coding Standards

## 1. Core Syntax & Formatting

- **Naming:** Follow `snake_case` for variables and functions, `PascalCase` for classes, and `UPPER_SNAKE_CASE` for constants and configuration flags.
- **Strings:** Prefer double quotes (`" "`) with f-strings for interpolation and triple double quotes for docstrings or multi-line literals.
- **Entry Point:** Guard executable scripts with `if __name__ == "__main__":` and keep script logic within functions to keep modules import-safe.
- **Formatting:** Stick to PEP 8, 4-space indentation, 88-character soft wrap, parentheses for multi-line expressions, and a single newline at EOF.

## 2. Imports & Dependencies

- **Order:** Group imports in the order: standard library, third-party, local modules; separate groups with a blank line and sort alphabetically within each group.
- **Specificity:** Avoid wildcard imports, expose symbols via `__all__` when building public APIs, and keep dependency versions pinned in tooling (`pyproject.toml`, `requirements.txt`).
- **Environment:** Use virtual environments (`venv`, `pipx`, `conda`) and document setup commands in README or DEVGUIDE.

## 3. Type Safety & Contracts

- **Annotations:** Add type hints to all public functions, methods, and module-level variables; rely on `from __future__ import annotations` so forward references stay lazy.
- **Typing helpers:** Favor `collections.abc`, `typing.Protocol`, `TypeVar`, and `Literal` over raw `Any`; document why `Any` is unavoidable when it is used.
- **Static checks:** Run `mypy`/`ruff` with the project config and treat the type checker as a gate before merges.

## 4. Documentation & Comments

- **Docstrings:** Use Google-style docstrings for modules, classes, and callables and include sections for `Args`, `Returns`, `Raises`, and `Examples` as appropriate.
- **Inline comments:** Only explain intent, not syntax, and keep them brief—prefer docstrings for API-level descriptions and tests for behavior verification.

## 5. Data Handling & Functional Logic

- **Comprehensions:** Use list, dict, or set comprehensions instead of `.append()` or `.update()` when building collections.
- **Immutability:** Prefer immutable structures (`tuple`, `NamedTuple`, `frozen dataclass`) for value objects and avoid mutating inputs unless explicitly documented.
- **Safe access:** Use `.get(key, default)`, `setdefault`, or `dict` unpacking to guard missing keys; avoid catching `KeyError` as control flow.
- **Lazy iteration:** Favor generator expressions or `itertools` for large datasets to limit peak memory usage.

## 6. Control Flow & Branching

- **Guard clauses:** Return early to reduce nesting, especially for validation, caching, or permission checks.
- **Match statements:** Use `match/case` for structured data branching when the readability gain exceeds a simple `if/elif` chain.
- **Truthiness helpers:** Use `any()`, `all()`, `operator` helpers, and `Enum` members instead of magic literals; avoid redundant comparisons like `if len(items) > 0:`.

## 7. Resource Management & IO

- **Context managers:** Wrap files, sockets, database cursors, and locks in `with` blocks; prefer `contextlib.ExitStack` when multiple resources must stay open.
- **Path handling:** Use `pathlib.Path` for filesystem operations and call `Path.read_text(encoding="utf-8")`/`write_text` instead of low-level `open` when simple reads/writes are needed.
- **Temporary resources:** Use `tempfile.TemporaryDirectory`/`NamedTemporaryFile` during tests or transient jobs and cleanly dispose external resources via `shutil`.

## 8. Async & Concurrent Patterns

- **Async APIs:** Prefer `async def` with `await`/`async with` for IO-bound work; isolate CPU-bound functions behind `asyncio.to_thread` or `ThreadPoolExecutor`.
- **Task management:** Use `asyncio.TaskGroup` (or `anyio.create_task_group`) for spawning concurrent work and propagate cancellation by awaiting all child tasks.
- **Blocking calls:** Avoid synchronous sleeps or blocking libraries in async contexts; where unavoidable, document the boundary and keep tasks short.

## 9. Error Handling & Logging

- **Specificity:** Catch only the exceptions you expect (e.g., `ValueError`, `KeyError`) and avoid bare `except:` blocks.
- **Reraising:** Wrap errors with context via `raise ... from e` so tracebacks remain informative.
- **Logging:** Use the `logging` module (`logging.getLogger(__name__)`) instead of `print()`, configure handlers at the application entry point, and emit structured, level-appropriate messages.

## 10. Testing, Tooling & CI

- **Testing:** Cover new logic with unit/integration tests, prefer `pytest` fixtures for reusable setup, and assert both happy paths and edge cases.
- **Toolchain:** Enforce linting via `ruff`, formatting via `black`, and type checking via `mypy` before merging new code; document commands in CONTRIBUTING or README.
- **CI signals:** Add `pytest --maxfail=1 --disable-warnings` to CI, keep coverage thresholds, and avoid skipping tests unless there is a documented risk.

## 11. Packaging & Distribution

- **Project metadata:** Source dependencies and scripts from `pyproject.toml` when possible and keep `setup.cfg` or `pyproject` metadata accurate.
- **Dependency hygiene:** Generate lockfiles with `pip-tools` or `pip freeze`/`pip-sync`, avoid installing packages globally, and add new dependencies to CI env setup.
- **Versioning:** Follow semantic versioning for public packages and bump versions alongside release notes or changelog entries.

## 12. Security & Performance

- **Validation:** Sanitize and validate all user input, escaping or rejecting suspicious content before further processing.
- **Avoid unsafe patterns:** Do not use `eval`, `exec`, or unchecked deserialization; use `secrets` for credentials and `hashlib`/`hmac` for digests.
- **Performance:** Cache expensive pure functions with `functools.cache`, profile before optimizing, and document trade-offs when evolving algorithms.
