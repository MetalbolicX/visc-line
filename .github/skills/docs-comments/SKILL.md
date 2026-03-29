---
name: 'docs-comments'
description: 'Intelligent code documentation and type-hinting tool that adds context-aware comments across languages. Use when code needs clearer reasoning, stronger type visibility, or export-level documentation before review or release.'
---

# Self-Explanatory Documenter + Type Engine

## When to use

- When a selection lacks documentation comments, type annotations, or both, especially for exported APIs, public helpers, or any onboarding surface.
- When the reviewer asks for richer context about why the code exists, which invariants it enforces, or how consumers should call it.
- When the user expects a machine-readable type surface with minimal guesswork, even in dynamically typed files.

## Execution Pipeline

### 1. Language & Type System Standards

Detect the file extension and follow the language-specific doc and typing conventions before editing.

| Extension               | Documentation Style                                                 | Type System Requirement                                                                                                |
| :---------------------- | :------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------- |
| `**/*.{ts,tsx,mts,cts}` | JSDoc (`/** */` above exported bindings)                            | Use TypeScript interfaces, type aliases, and generics; avoid `any` by preferring `unknown`, `never`, or strict unions. |
| `**/*.{js,jsx,mjs,cjs}` | JSDoc with `@param`, `@returns`, `@typedef`, `@remarks`, `@example` | Annotate exports with `@type` if necessary and keep `@param` definitions as precise as the usage warrants.             |
| `**/*.py`               | Docstrings following PEP 257                                        | Add PEP 484 type hints, prefer `typing.TypedDict`, `Protocol`, or `TypeVar` instead of `Any` when possible.            |
| `**/*.php`              | PHPDoc (`/** */`)                                                   | Declare PHP 8+ scalar and union types on parameters, return types, and promoted properties.                            |
| `**/*.rs`               | Rustdoc `///` or `//!` for modules                                  | Document every public struct, enum, trait, and function; lean on `Result` and explicit lifetimes.                      |
| `**/*.go`               | Go doc comments (Effective Go commentary)                           | Annotate exported identifiers with prose and explicit error returns, include contextual `error` semantics.             |
| `**/*.java`             | Javadoc (`/** */`)                                                  | Keep signatures typed, document generics, `@throws`, and `@param` constraints; mention thread safety when relevant.    |
| `**/*.cs`               | XML doc comments (`///`)                                            | Use nullable annotations, document `exceptions`, and mention whether members mutate state.                             |
| `**/*.swift`            | Swift doc comments (`///`)                                          | Describe optionals, `throws`, `async`, and refer to value semantics in structs vs classes.                             |
| `**/*.dart`             | Dart doc comments (`///`)                                           | Use named parameters with `required`, specify `Future`/`Stream` exports, and mention platform constraints.             |
| `**/*.kt`               | KDoc (`/** */`)                                                     | Dramatize sealed interfaces, nullability, and coroutine scopes with typed parameters.                                  |
| `**/*.{c,cpp}`          | Doxygen-style comments (`/** */`)                                   | Document ownership, const correctness, and lifetime requirements for pointers/references.                              |
| `.rb`                   | YARD/RDoc tags (`# @param`)                                         | Annotate Sorbet sigs or inline `@param`, `@return`, and mention duck-typed expectations.                               |

For unsupported or ambiguous extensions, default to a JSDoc-style block and use the most explicit type annotations available in the language.

### 2. The "Type-First" Rule

- If the signature already reveals the intent (e.g., `user: User`), skip the redundant description and focus on the invariant or constraint not visible in the type.
- Only describe parameters when they involve value ranges, formatting rules, thread affinity, or other restrictions that types cannot express alone.
- Prefer generics, `Union`s, or refined mapped types over fallback types such as `any`, `unknown`, or `Any`. Document when a type deliberately spans multiple shapes.
- When a function negotiates state (e.g., `isPending` flags, `status` enums), explain the transitions or conditions on top of the type signature.

### 3. Commenting Philosophy

- Explain _why_ the code exists, how its invariants are sustained, and which external contracts it honors, not just _what_ it does.
- Prioritize documentation for regex, unusual maths, error-rate handling, API quotas/rate limits, memoization, caching, or concurrency boundaries.
- Every exported member must have a standard doc block that includes parameters, return values, side effects, and the reasons for throwing errors.
- Supplement doc blocks with `@example` or usage snippets when usage is non-trivial or when discussing boundary values.
- Keep prose concise but specific; avoid generalities like "makes an API call" when you can say "queries the quota endpoint to refresh tokens every 90 seconds."

### 4. Special Annotations

Use the annotation keywords sparingly to call out future work or hazards:

- `TODO`: Outline missing documentation, tests, or type refinements that should be resolved before release.
- `FIXME`: Flag known bugs, incorrect invariants, or dangerous shortcuts that warrant immediate attention.
- `HACK`: Annotate external workarounds, library bugs, or temporary polyfills that will need cleanup later.
- `PERF`: Highlight hot paths that deserve benchmarking, caching, or algorithmic review.
- `SECURITY`: Call out unvalidated inputs, authorization notes, sanitizer usage, or places requiring threat modeling.

### 5. Execution Logic

1. **Analyze selection**: Check whether names, parameters, and return values need clarification; scan for missing types or docs.
2. **Inject types**: Expand declarations with the tightest type available (interfaces, typed dictionaries, union, generics) before writing the doc block, especially in dynamic files.
3. **Insert docs**: Place the documentation block directly above the function, class, or constant definition; ensure each exported or externally visible symbol is covered.
4. **Refactor suggestion**: If a rename (e.g., `calculate_tax` → `calculate_vat`) or a signature change makes the intent clearer than a comment, append a short post-fix note describing the preferred rename or refactor.
   4b. When adding doc comments, weave in the reason behind the type constraints (e.g., "Rate must stay below 1.0 because the downstream API rejects higher values").
5. **Verify**: Ensure the new doc block references only the current logic, includes examples when needed, and does not restate the type unless a special constraint justifies it.

### Examples

```py
# Before

def calculate(p, r):
    return p * r

# After

def calculate_tax(price: float, rate: float = 0.16) -> float:
    """
    Calculates the total tax based on Mexico's VAT rate.
    - `price`: The base price of the item. Must be a positive float.
    - `rate`: The tax rate expressed as a decimal (e.g., 0.19). Must stay between 0 and 1 to avoid API rejection. By default, it uses Mexico's standard VAT rate of 16%.
    - Returns: The tax amount to add to the final invoice.
    - Note: Compound taxes and discounts are handled upstream before this call.
    - Example: `calculate_tax(100.0, 0.19)` returns `19.0`.
    """
    return price * rate
```

````js
/**
 * Fetches user data from the API based on the provided user ID.
 * @param {string} userId - The unique identifier of the user. Must be a non-empty string.
 * @returns {Promise<Object>} A promise that resolves to the user data object containing `id`, `name`, and `email` properties.
 * @throws {Error} Throws an error if the fetch operation fails or if the response is not OK. Consumers should handle this with a try-catch block or by chaining a `.catch()` to the returned promise.
 * @example
 * ```js
 * fetchUserData('12345')
 *   .then(user => console.log(user.name))
 *   .catch(error => console.error('Error fetching user data:', error));
 * ```
 */
const fetchUserData = async (userId) => {
  const response = await fetch(`/api/users/${userId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch user data for ID ${userId}`);
  }
  return response.json();
};
````

## References

- Glean technical writing guidelines for clarity-first docs: https://www.glean.com/docs/technical-writing/
- Go "Effective Go" documentation rules for comments and exported identifiers: https://go.dev/doc/effective_go#commentary
- Rustdoc comment basics when touching `pub` crates: https://doc.rust-lang.org/rustdoc/comment-basics.html
- Python PEP 257 for docstring conventions and PEP 484 for type hints: https://www.python.org/dev/peps/pep-0257/, https://www.python.org/dev/peps/pep-0484/
- TypeScript JSDoc and type annotation best practices: https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html
- Java Javadoc conventions for public APIs: https://www.oracle.com/technical-resources/articles/java/javadoc-tool.html
- C# XML documentation guidelines: https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/xmldoc/xml-doc-comments
- Swift documentation comments and best practices: https://docs.swift.org/swift-book/ReferenceManual/Declarations.html#ID413
- Dart documentation comments and conventions: https://dart.dev/guides/language/effective-dart/documentation
- KDoc for Kotlin documentation: https://kotlinlang.org/docs/kotlin-doc.html
- Doxygen for C/C++ documentation: https://www.doxygen.nl/manual/docblocks.html
- YARD for Ruby documentation: https://yardoc.org/
