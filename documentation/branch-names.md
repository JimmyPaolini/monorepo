# Branch Naming Conventions

Branch names follow [Conventional Commits](https://www.conventionalcommits.org/) format with **required scopes**.

## Format

```text
<type>/<scope>-<description>
```

**Examples:**

```bash
feat/lexico-user-auth
fix/monorepo-build-script
docs/caelundas-api-guide
chore/dependencies-update-nx
```

**Special branches:** `main`, `develop`, `renovate/*`, `dependabot/*`

## Rules

1. **Type** (required): `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`
2. **Scope** (required): Project (`caelundas`, `lexico`, `lexico-components`, `JimmyPaolini`) or category (`monorepo`, `applications`, `packages`, `tools`, `documentation`, `dependencies`, `infrastructure`, `deployments`, `testing`, `linting`, `scripts`, `configuration`)
3. **Description** (required): lowercase, kebab-case, descriptive

Types and scopes are defined in [conventional.config.cjs](../conventional.config.cjs) and shared with [commitlint.config.ts](../commitlint.config.ts).

## Validation

- **Local:** `.husky/pre-push` hook (runs before push)
- **CI:** `.github/workflows/branch-validation.yml` (runs on PR)
- **Config:** `validate-branch-name.config.cjs` (imports from `conventional.config.cjs`)

## Creating Branches

```bash
git checkout -b feat/lexico-dashboard
git checkout -b fix/caelundas-timezone
git checkout -b docs/monorepo-architecture
```

## Renaming Branches

```bash
git branch -m <type>/<scope>-<description>
git push origin -u <new-branch-name>
git push origin --delete <old-branch-name>  # If already pushed
```
