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

## References

- [Testing Strategy](../../code-quality/testing-strategy.md)
- [Vitest](../../vitest.md)
