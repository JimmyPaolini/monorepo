# Tool Execution Model

## When to Use `nx run` vs. Direct Tool Invocation

This document clarifies when to use Nx task execution (`nx run`, `nx run-many`, `nx affected`) versus running tools directly.

## Nx Task Execution (ALWAYS)

Use `nx run` for **monorepo tasks** that benefit from caching, dependency awareness, and affected computation:

### TypeScript & JavaScript Tasks

```bash
# ✅ CORRECT: Use Nx for monorepo tasks
nx run caelundas:build
nx run lexico:typecheck
nx run-many --target=lint --all
nx affected --target=test --base=main

# ❌ WRONG: Bypasses Nx caching and dependency graph
pnpm build
pnpm test
tsc
```

### Why Use Nx?

- **Caching**: Skips tasks with unchanged inputs (speeds up CI/CD)
- **Dependency awareness**: Rebuilds dependents when dependencies change
- **Affected computation**: Tests only changed projects (`nx affected`)
- **Task orchestration**: Runs tasks in correct order based on project graph
- **Parallel execution**: Runs independent tasks concurrently

### Covered Tasks

- `build`: TypeScript compilation, bundling
- `typecheck`: Type checking without emitting
- `lint`: ESLint, Oxlint, Biome
- `test`: Vitest, Jest
- `format`: Prettier, formatting checks
- `code-analysis`: Static analysis suites
- Any custom target defined in `project.json`

## Direct Tool Invocation (Infrastructure & External Systems)

Use **direct tool commands** for **infrastructure operations** that are **outside the Nx task graph**:

### Docker

```bash
# ✅ CORRECT: Docker operates outside Nx
docker build --platform linux/amd64 -t myapp:latest .
docker push ghcr.io/jimmypaolini/myapp:latest
docker compose up -d

# Note: Nx targets wrap these (e.g., nx run caelundas:docker-build)
# but the underlying Docker CLI runs directly
```

**Why?** Docker builds create artifacts external to the workspace (container images in registries).

### Kubernetes & Helm

```bash
# ✅ CORRECT: K8s operations are infrastructure
kubectl get pods
kubectl apply -f manifest.yaml
helm upgrade --install myapp ./charts/myapp
helm list
```

**Why?** Kubernetes manages cluster state, not workspace files. Nx cannot cache or track K8s resources.

### Supabase CLI

```bash
# ✅ CORRECT: Supabase manages external database state
supabase start
supabase db push
supabase db diff
supabase gen types typescript --local > types.ts

# Note: Nx targets wrap these (e.g., nx run lexico:supabase:start)
# but the underlying Supabase CLI runs directly
```

**Why?** Supabase manages Docker containers and database migrations outside the Nx workspace.

### Git Operations

```bash
# ✅ CORRECT: Git operations are version control
git commit -m "feat: add feature"
git push origin main
git checkout -b feat/new-feature
```

**Why?** Git tracks version history, not Nx task execution.

### Package Management

```bash
# ✅ CORRECT: pnpm manages dependencies
pnpm install
pnpm add --filter lexico react@19
pnpm update
```

**Why?** pnpm operates on `package.json` and `pnpm-lock.yaml`, which are inputs to Nx tasks, not tasks themselves.

## Nx Wrappers for Infrastructure Tools

Many infrastructure tools have Nx target wrappers for convenience and consistency, but they still invoke tools directly under the hood:

```json
// project.json
{
  "targets": {
    "docker-build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "docker build --platform linux/amd64 -t myapp ."
      }
    },
    "supabase:start": {
      "executor": "nx:run-commands",
      "options": {
        "command": "supabase start"
      }
    }
  }
}
```

**Use the Nx wrapper when available** (e.g., `nx run lexico:supabase:start`) for:

- Consistency with monorepo task execution patterns
- Project-specific context (cwd, environment)
- Documentation in `project.json`

## Decision Flow

```text
┌─────────────────────────────────────┐
│ Does this task operate on           │
│ workspace source files?             │
└─────────────┬───────────────────────┘
              │
         ┌────┴────┐
         │   YES   │   Use `nx run`
         │         │   (build, lint, test, typecheck)
         └─────────┘
              │
         ┌────┴────┐
         │   NO    │
         └─────────┘
              │
         ┌────┴────────────────────────┐
         │ Does it manage external     │
         │ infrastructure?             │
         └─────────────────────────────┘
              │
         ┌────┴────┐
         │   YES   │   Use direct tool
         │         │   (docker, kubectl, supabase, git, pnpm)
         └─────────┘
```

## Examples

| Task               | Command                                | Reason                                          |
| ------------------ | -------------------------------------- | ----------------------------------------------- |
| Build caelundas    | `nx run caelundas:build`               | TypeScript compilation (workspace task)         |
| Lint all projects  | `nx run-many --target=lint --all`      | ESLint on source files (workspace task)         |
| Test affected      | `nx affected --target=test`            | Run tests for changed projects (workspace task) |
| Build Docker image | `docker build -t myapp .`              | Creates external artifact (infrastructure)      |
| Deploy to K8s      | `helm upgrade --install myapp ./chart` | Manages cluster resources (infrastructure)      |
| Start Supabase     | `supabase start`                       | Manages Docker containers (infrastructure)      |
| Install packages   | `pnpm install`                         | Manages dependencies (package manager)          |
| Commit code        | `git commit -m "message"`              | Version control (not a build task)              |
| Run dev server     | `nx run lexico:develop`                | Nx task that wraps Vite (workspace task)        |

## Performance Implications

### Nx Caching Benefits

```bash
# First run: Full execution
nx run caelundas:build
# ✓ Built in 15s

# Second run (no changes): Instant from cache
nx run caelundas:build
# ✓ Restored from cache in 50ms [remote cache]
```

### When Bypassing Nx Hurts

```bash
# Running directly bypasses cache
pnpm --filter caelundas build
# Always rebuilds, even if nothing changed (15s every time)
```

## Common Mistakes

### ❌ Running Tests Directly

```bash
# WRONG: Bypasses Nx cache and affected computation
vitest run
pnpm test
```

```bash
# CORRECT: Use Nx
nx run caelundas:test
nx affected --target=test
```

### ❌ Running Docker via pnpm

```bash
# WRONG: Unnecessary npm script wrapper
pnpm docker:build
```

```bash
# CORRECT: Direct Docker CLI (or Nx wrapper)
docker build -t myapp .
# OR (if Nx target exists)
nx run caelundas:docker-build
```

### ❌ Running Supabase via npm scripts

```bash
# WRONG: Adds indirection
pnpm --filter lexico supabase:start
```

```bash
# CORRECT: Use Nx wrapper
nx run lexico:supabase:start
```

## Summary

- **Nx for workspace tasks**: build, lint, test, typecheck, format
- **Direct tools for infrastructure**: docker, kubectl, helm, supabase, git, pnpm
- **Use Nx wrappers when available** for consistency
- **Never bypass Nx for cacheable tasks** (costs performance)
