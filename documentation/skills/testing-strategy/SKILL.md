---
name: testing-strategy
description: Use monorepo testing conventions: unit, integration, end-to-end test naming and Nx commands. Use when adding tests or recommending test coverage.
license: MIT
---

# Testing Strategy

This skill describes the monorepo testing model and naming conventions.

## When to Use This Skill

Use when asked to:

- Add tests or choose test types
- Name test files correctly
- Run tests via Nx
- Recommend coverage or test scope

## Test Types and Naming

- Unit: `*.unit.test.ts`
- Integration: `*.integration.test.ts`
- End-to-end: `*.end-to-end.test.ts`

## Run Tests

```bash
nx run <project>:test:unit
nx run <project>:test:integration
nx run <project>:test:end-to-end
nx affected --target=test --base=main
```

## Coverage Verification

When a task includes coverage goals (or CI enforces coverage thresholds), run:

```bash
nx run <project>:test --configuration=coverage
```

Key practice: after structural test refactors (renaming, regrouping, helper extraction), always re-run coverage to verify no threshold regression.

If branch coverage is just below threshold, add focused tests for uncovered guard/fallback branches first (for example undefined/null guards, sparse-array fallbacks, and error-only paths).

Additional coverage practices from recent 96% threshold work:

- Keep project Vitest configs thin and inherit shared defaults using `mergeConfig(...)` from `configuration/vitest.config.ts` so threshold changes stay centralized.
- Use a hotspot-first loop: generate coverage, sort the lowest branch-coverage files, patch the highest-impact offenders, then re-run coverage.
- Raise coverage with behavior-first assertions, not synthetic test inflation. Prioritize guard clauses, empty-result paths, fallback branches, and explicit error paths.
- Add dedicated branch-focused test files for services with dense branching logic so intent stays explicit and regressions are easier to detect after refactors.
- Prefer deterministic fixtures and fixed clocks for time-sensitive or orbital/math-heavy logic to keep branch tests stable.
- For orchestration services, combine focused unit tests with a small set of integration tests that verify cross-service error propagation and empty-data behavior.
- Include module wiring and constants/types-adjacent smoke tests where needed so structural files do not remain persistent blind spots under strict thresholds.
- Before opening or updating a coverage-focused PR, run the CI-shaped command locally: `nx affected --target=test --configuration=coverage --base=main`.

## References

- [Testing Strategy](../../code-quality/testing-strategy.md)
- [Vitest](../../vitest.md)
