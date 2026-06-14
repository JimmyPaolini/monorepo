# Skills Documentation

This directory contains the monorepo's GitHub Copilot agent skills.

## Layout

- `documentation/skills/<skill-name>/SKILL.md` is the source file for each
  skill.
- `.github/skills` is a symlink to this directory so Copilot can discover the
  same content directly.

## Current Skill Set

The workspace currently ships **35 skills**:

- Workflow: `checkout-branch`, `commit-code`, `create-pull-request`,
  `refresh-documentation`, `rename-branch`, `resolve-conflicts`,
  `submit-changes`, `triage-deployment`, `triage-submission`,
  `update-pull-request`, `validate-code`
- Nx and tooling: `code-generator-patterns`, `github-actions`,
  `link-workspace-packages`, `monitor-ci`, `nx-generate`, `nx-import`,
  `nx-plugins`, `nx-run-tasks`, `nx-workspace`, `tool-execution-model`
- Project and domain: `docker-workflows`, `ephemeris-pipeline`,
  `error-handling-patterns`, `kubernetes-deployment`, `simplify-code`,
  `tanstack-start-ssr`, `testing-strategy`, `typescript-conventions`
- MCP and data access: `mcp-chrome-devtools`, `mcp-figma`, `mcp-shadcn`,
  `mcp-terraform`, `postgres-data`, `postgres-sql`

The root [AGENTS.md](../../AGENTS.md) file includes the synchronized skill table
used by agents during discovery.

## Adding or Updating a Skill

1. Create or edit `documentation/skills/<skill-name>/SKILL.md`.
2. Keep bundled references, templates, and examples inside the same skill
   directory.
3. Update any human-facing index pages that mention the skill.
4. Run the sync task if the AGENTS skill table changed:

   ```bash
   pnpm nx run monorepo:sync-agent-skills
   ```

## Verification

```bash
test -L .github/skills && echo "✓ .github/skills symlink exists"
test -f .github/skills/mcp-shadcn/SKILL.md && echo "✓ Copilot can read skills"
```

## Related Documentation

- [AGENTS.md](../../AGENTS.md) — workspace-level instructions
- [tools/conformance/AGENTS.md](../../tools/conformance/AGENTS.md) — generator
  development guidance
- [documentation/development/conformance.md](../development/conformance.md) —
  generator overview
