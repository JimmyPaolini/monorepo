# Common Gotchas and Solutions

## TypeScript

### Index Signatures Require Null Checks

**Problem**: With `noUncheckedIndexedAccess`, array/object access returns `T | undefined`.

```typescript
const items = ["a", "b", "c"];
const first = items[0]; // Type: string | undefined
console.log(first.toUpperCase()); // ❌ Error: Object is possibly 'undefined'
```

**Solution**: Use optional chaining or null checks:

```typescript
console.log(items[0]?.toUpperCase()); // ✅ Returns undefined if missing
const first = items[0] ?? "default"; // ✅ Provide default value
```

### ESLint Rules Disabled for JavaScript Config Files

**Problem**: Type-checked ESLint rules don't work in `.js` config files.

**Solution**: This is expected. See [eslint.config.base.ts](../../eslint.config.base.ts) — type-checked rules are disabled for `.js`, `.cjs`, `.mjs` files.

JavaScript config files (e.g., `prettier.config.js`, `vitest.config.js`) cannot use TypeScript type checking rules.

## Supabase

### Types Out of Sync After Schema Changes

**Problem**: TypeScript errors after running migrations:

```typescript
// Error: Property 'new_column' does not exist on type 'Database'
const { data } = await supabase.from("users").select("new_column");
```

**Solution**: Always regenerate types after schema changes:

```bash
# Run immediately after migrations
nx run lexico:supabase:generate-types
```

**Prevention**: Add to migration workflow:

```bash
nx run lexico:supabase:database-diff    # Create migration
nx run lexico:supabase:generate-types   # Regenerate types
```

### Local Supabase Not Starting

**Problem**: `nx run lexico:supabase:start` hangs or fails.

**Common causes**:

1. **Docker not running**: Start Docker Desktop
2. **Port conflicts**: Another process using ports 54321-54325
3. **Stale containers**: Previous Supabase instance not stopped

**Solution**:

```bash
# Stop existing Supabase containers
nx run lexico:supabase:stop

# Check for port conflicts
lsof -i :54321

# Restart Docker
docker restart $(docker ps -q)

# Start fresh
nx run lexico:supabase:start
```

## Docker & Kubernetes

### Docker Image Platform Mismatch

**Problem**: Image built on Apple Silicon doesn't run on Kubernetes (amd64 cluster).

```bash
# Build on M1/M2 Mac
docker build -t myapp .

# Deploy to K8s
kubectl apply -f deployment.yaml
# Error: exec format error
```

**Solution**: Always build for `linux/amd64`:

```bash
docker build --platform linux/amd64 -t myapp .
```

**Verification**:

```bash
docker inspect myapp | jq '.[0].Architecture'
# Should output: "amd64"
```

See [docker-workflows skill](../skills/docker-workflows/SKILL.md) for platform targeting details.

### Kubernetes Job Not Starting

**Problem**: Job stays in "Pending" state.

**Common causes**:

1. **Image pull error**: Cannot pull from GHCR (check image pull secrets)
2. **Resource limits**: Cluster doesn't have enough CPU/memory
3. **PVC not bound**: PersistentVolumeClaim is pending

**Solution**:

```bash
# Check job status
kubectl describe job caelundas-20260226-143000

# Check pod events
kubectl get pods -l job-name=caelundas-20260226-143000
kubectl describe pod <pod-name>

# Check PVC
kubectl get pvc
kubectl describe pvc caelundas-output

# Image pull secrets
kubectl get secret ghcr-credentials
```

### PVC Not Deleted After Job Completion

**Problem**: Orphaned PVCs consuming storage after jobs complete.

**Cause**: PVCs are **not** automatically deleted when Jobs/Pods are removed.

**Solution**: Manually delete PVCs:

```bash
# List PVCs
kubectl get pvc

# Delete specific PVC
kubectl delete pvc caelundas-output

# Delete all caelundas PVCs
kubectl delete pvc -l app=caelundas
```

**Prevention**: Set up cleanup automation (cron job or manual script).

See [deployment-models.md](../architecture/deployment-models.md) for PVC lifecycle management.

## Nx

### Task Not Running (Cache Hit When It Shouldn't)

**Problem**: File changed but Nx says "cache hit".

**Cause**: Nx inputs don't include the changed file.

**Solution**: Clear Nx cache and verify inputs:

```bash
# Clear local cache
nx reset

# Check task inputs
nx show project caelundas --web

# Run without cache
nx run caelundas:build --skip-nx-cache
```

**Fix**: Add missing inputs to `project.json`:

```json
{
  "targets": {
    "build": {
      "inputs": [
        "default",
        "{projectRoot}/custom-config.json" // Add missing file
      ]
    }
  }
}
```

### Bypassing Nx Costs Performance

**Problem**: Running `pnpm test` directly is slower than `nx run <project>:test`.

**Why**: Bypasses Nx caching and dependency checks.

**Solution**: Always use Nx for monorepo tasks:

```bash
# ❌ WRONG: No cache
pnpm --filter caelundas test

# ✅ CORRECT: Uses Nx cache
nx run caelundas:test
```

See [tool-execution-model.md](../development/tool-execution-model.md) for when to use Nx vs. direct tools.

## Git

### Commit Rejected by commitlint

**Problem**: Commit message doesn't follow Conventional Commits format.

```bash
git commit -m "fix bugs"
# Error: subject may not be empty [subject-empty]
```

**Solution**: Follow format: `<type>(<scope>): <gitmoji> <subject>`

```bash
git commit -m "fix(caelundas): 🐛 resolve date parsing error"
```

See [commit-code skill](../skills/commit-code/SKILL.md) for full format rules.

### Branch Name Rejected on Push

**Problem**: Pre-push hook rejects branch name.

```bash
git push
# Error: Branch name 'my-feature' does not match pattern: <type>/<scope>-<description>
```

**Solution**: Rename branch with correct pattern:

```bash
git branch -m feat/caelundas-new-aspect-detection
git push
```

See [checkout-branch skill](../skills/checkout-branch/SKILL.md) for naming rules.

### Git Hooks Bypassed (--no-verify)

**Problem**: Bypassing hooks with `--no-verify` causes CI failures.

```bash
# ❌ NEVER DO THIS
git commit --no-verify
git push --no-verify
```

**Solution**: Fix the underlying issue instead:

- **Linting fails**: Run `nx run-many --target=lint --all --fix`
- **Formatting fails**: Run `pnpm format`
- **Commitlint fails**: Fix commit message format
- **Branch name fails**: Rename branch

**If hook is genuinely broken**: Fix the hook configuration, don't bypass it.

See [Git Workflow Rules](../../AGENTS.md#git-workflow-rules) for hook enforcement policy.

## shadcn/ui (lexico-components)

### Modifying `ui/` Files Breaks on Update

**Problem**: You edit a file in `packages/lexico-components/src/components/ui/button.tsx`, then run `pnpx shadcn@latest add button` and lose your changes.

**Cause**: shadcn CLI overwrites files in `ui/` directory.

**Solution**: Never modify `ui/` files directly. Create custom components in `src/components/`:

```typescript
// ❌ WRONG: Edit ui/button.tsx directly

// ✅ CORRECT: Create custom component
// src/components/primary-button.tsx
import { Button } from "./ui/button";

export const PrimaryButton = (props) => {
  return <Button variant="default" size="lg" {...props} />;
};
```

See [lexico-components AGENTS.md](../../packages/lexico-components/AGENTS.md) for component patterns.

### Theme Colors Not Updating

**Problem**: Changed CSS variables in `globals.css` but colors don't update.

**Cause**: Browser/build cache or incorrect CSS variable format.

**Solution**:

1. **Check format**: CSS variables must be HSL values without `hsl()` wrapper:

```css
/* ✅ CORRECT */
--primary: 0 0% 9%;

/* ❌ WRONG */
--primary: hsl(0, 0%, 9%);
```

1. **Clear cache**:

```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Restart dev server
nx run lexico:develop
```

1. **Hard refresh**: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

## Performance

### Slow Type Checking

**Problem**: `nx run <project>:typecheck` takes > 30 seconds.

**Causes**:

1. **Too many files**: Incremental checking not enabled
2. **Circular dependencies**: TypeScript re-checks same files repeatedly
3. **No `composite` mode**: Can't reuse previous builds

**Solution**:

1. **Enable incremental mode** in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "incremental": true,
    "composite": true
  }
}
```

1. **Check for circular deps**:

```bash
nx run monorepo:dependency-analysis
```

### Slow Test Execution

**Problem**: Unit tests take > 5 seconds to run.

**Causes**:

1. **Running integration/E2E tests**: Check test type
2. **No parallelization**: Tests running sequentially
3. **Unnecessary setup**: BeforeEach doing too much

**Solution**:

```bash
# Run only unit tests (fast)
nx run caelundas:test:unit

# Enable parallelization (Vitest default)
# Check vitest.config.ts for maxWorkers
```

## Common Error Messages

### "Cannot find module '@monorepo/lexico-components'"

**Cause**: TypeScript path mappings not configured or stale node_modules.

**Solution**:

```bash
pnpm install
nx reset
```

### " exec format error" (Docker/K8s)

**Cause**: Architecture mismatch (arm64 image on amd64 cluster).

**Solution**: Rebuild for correct platform:

```bash
docker build --platform linux/amd64 -t myapp .
```

### "Forbidden (403)" from GHCR

**Cause**: Not authenticated or missing permissions.

**Solution**:

```bash
# Re-authenticate
echo $GITHUB_TOKEN | docker login ghcr.io -u <username> --password-stdin

# Check token permissions (needs read:packages, write:packages)
```

## Resources

- [Tool Execution Model](../development/tool-execution-model.md) - Nx vs. direct tools
- [Deployment Models](../architecture/deployment-models.md) - K8s Job/PVC issues
- [Docker Workflows Skill](../skills/docker-workflows/SKILL.md) - Platform targeting
- [Supabase Development Skill](../skills/supabase-development/SKILL.md) - Migration workflows
- [TypeScript Conventions](../conventions/typescript.md) - Strict mode gotchas
