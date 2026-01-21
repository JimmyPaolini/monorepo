# monorepo

## Code Quality Tools

### Knip - Unused Code Detection

Knip finds and removes unused files, dependencies, and exports across the monorepo.

**Check for unused code:**

```bash
# Check entire monorepo
nx run monorepo:knip

# Check specific project
nx run caelundas:knip
nx run lexico:knip
nx run lexico-components:knip
nx run code-generator:knip

# Check only affected projects
nx affected --target=knip

# Explicitly use check configuration
nx run monorepo:knip:check
```

**Auto-fix unused code:**

```bash
# Fix entire monorepo (use with caution)
nx run monorepo:knip:write

# Fix specific project
nx run caelundas:knip:write
nx run lexico:knip:write
```

**Note:** Review knip findings carefully before running `knip:write`.
The write configuration automatically removes unused files, dependencies, and exports.

**Integration:**

- Pre-commit hooks: Runs automatically on staged files via lint-staged
- CI/CD: Runs on all PRs via GitHub Actions workflow
