---
name: simplify-code
description: Workflow to identify overly complex functions using ESLint complexity rules (max-statements, max-lines, complexity, max-depth) and refactor them towards simplicity using Refactoring.Guru guidelines. Use when asked to "simplify code", "reduce complexity", "refactor large functions", or fix ESLint complexity warnings and errors.
license: Complete terms in LICENSE.txt
---

# Simplify Code

This skill provides a systematic approach to identifying and refactoring overly complex, deeply nested, or excessively long functions, relying on strict linting rules and best-practice refactoring techniques.

## When to Use This Skill

- When resolving ESLint errors related to `max-statements`, `max-lines-per-function`, `complexity`, or `max-depth`.
- When asked to "simplify," "refactor," or "clean up" a specific file or function.
- When you encounter deeply nested code or massive blocks of procedural logic that are hard to read.

## Prerequisites

- Access to the workspace's ESLint setup to run checks.
- Ability to search the web using tools like `fetch_webpage` or `activate_web_interaction` to read specific refactoring techniques directly from **Refactoring.Guru**.

## Step-by-Step Workflow

1. **Identify the Complex Code**
   - Run the lint task for the target project (e.g., `nx run <project>:lint`) or review the linting errors provided by the user.
   - Identify the specific functions violating the complexity rules:
     - `max-lines-per-function` (> 32 lines)
     - `max-statements` (> 16 statements)
     - `complexity` (cyclomatic complexity > 8)
     - `max-depth` (nesting > 4)

2. **Consult Refactoring.Guru**
   - Before rewriting the code, actively browse the web (e.g., `https://refactoring.guru/refactoring/techniques`) to look up appropriate refactoring techniques (e.g., "Extract Method", "Replace Temp with Query", "Decompose Conditional", "Replace Nested Conditional with Guard Clauses").
   - Match the specific code smell (e.g., "Long Method" or "Deeply Nested Control Flow") to the recommended refactoring pattern based on the live documentation.

3. **Plan the Refactoring**
   - Break down the complex function into logical, smaller, single-responsibility functions.
   - Name the new functions clearly and meaningfully to describe their exact purpose. Do NOT use acronyms or abbreviations (e.g., prefer `calculateTotalRevenue` over `calcTotRev`).
   - Extract conditions into clearly named helper functions.
   - Flatten nested blocks using early returns / guard clauses.
   - Identify shared state or variables that need to be passed down or scoped appropriately.

4. **Apply the Refactoring**
   - Implement the smaller functions and rewrite the main function to act as an orchestrator.
   - Use the `multi_replace_string_in_file` tool to make precise edits without disrupting the rest of the file.

5. **Verify**
   - Re-run the lint checks (e.g., `nx run <project>:lint`) on the modified file to confirm that the complexity metrics are now within the allowed thresholds.
   - Run the typechecker (e.g., `nx run <project>:typecheck`) to ensure types are still valid.
   - Run the project's tests (e.g., `nx run <project>:test`) to verify that the refactoring did not break any logical equivalence.

## References

- [Refactoring.Guru: Refactoring Techniques](https://refactoring.guru/refactoring/techniques)
- [Refactoring.Guru: Code Smells](https://refactoring.guru/refactoring/smells)
