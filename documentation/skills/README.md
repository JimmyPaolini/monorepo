# Skills Documentation

This directory contains skill files that provide domain-specific knowledge for AI agents working in the monorepo. Each skill covers a specific technology, workflow, or pattern used across projects.

## Directory Structure

Skills live in `documentation/skills/` with symlinks for AI agent integration:

```text
documentation/skills/
├── README.md (this file)
├── code-generator-patterns/
│   └── SKILL.md
├── commit-code/
│   └── SKILL.md
├── docker-workflows/
│   └── SKILL.md
└── ...

.github/
└── skills@ -> ../documentation/skills  (GitHub Copilot)

.claude/
└── skills@ -> ../documentation/skills  (Claude Code)
```

## Available Skills

### Domain-Specific Skills

**[code-generator-patterns](code-generator-patterns/SKILL.md)**

- Creating Nx generators with templates and prompts
- Generator framework patterns
- File generation and modification

**[ephemeris-pipeline](ephemeris-pipeline/SKILL.md)**

- NASA JPL API integration
- Astronomical calculations
- Event detection algorithms
- Calendar generation

**[tanstack-start-ssr](tanstack-start-ssr/SKILL.md)**

- TanStack Start server-side rendering
- File-based routing patterns
- Server functions and data loading
- SSR debugging

**[supabase-development](supabase-development/SKILL.md)**

- Supabase migrations and schema management
- Row-Level Security (RLS) policies
- Edge Functions development
- Database type generation

### Infrastructure Skills

**[kubernetes-deployment](kubernetes-deployment/SKILL.md)**

- Helm chart patterns
- K8s resource management
- PVC and job workflows
- Deployment troubleshooting

**[docker-workflows](docker-workflows/SKILL.md)**

- Multi-stage Docker builds
- Platform targeting (linux/amd64)
- GHCR integration
- Container optimization

### MCP Server Skills

**[mcp-shadcn](mcp-shadcn/SKILL.md)**

- Adding and updating shadcn/ui components
- Component customization
- Registry management

**[mcp-supabase](mcp-supabase/SKILL.md)**

- Database operations via MCP
- Migration management
- RLS policy management
- Edge Functions via MCP

**[mcp-chrome-devtools](mcp-chrome-devtools/SKILL.md)**

- Browser debugging via Chrome DevTools Protocol
- Performance profiling
- Network inspection
- DOM manipulation

**[mcp-figma](mcp-figma/SKILL.md)**

- Design file access
- Asset extraction
- Design token sync
- Component specification parsing

**[mcp-terraform](mcp-terraform/SKILL.md)**

- Infrastructure as code via MCP
- Plan and apply workflows
- State management
- Multi-environment deployment

**[mcp-github](mcp-github/SKILL.md)**

- Repository operations
- PR creation and review
- Issue management
- Automated workflows

### Process Skills

**[checkout-branch](checkout-branch/SKILL.md)**

- Git branch naming conventions
- Type/scope/description format
- Validation and troubleshooting
- Renaming invalid branches

**[commit-code](commit-code/SKILL.md)**

- Conventional Commits format
- Gitmoji integration
- Scope selection
- Subject line rules (50 char max)

**[create-pull-request](create-pull-request/SKILL.md)**

- PR title and description conventions
- PR creation workflow with GitHub CLI and MCP tools
- CI requirements and checks
- Issue linking and review requests

**[github-actions](github-actions/SKILL.md)**

- Workflow creation and testing
- Composite actions
- Nx integration
- Cache management

## Skill File Format

Each skill follows this structure:

```markdown
---
name: skill-name
description: Brief description of when to use this skill
license: MIT
---

# Skill Name

## When to Use

- Clear criteria for when this skill is relevant

## Key Concepts

- Core knowledge areas covered

## Workflows

- Step-by-step common workflows

## Project-Specific Patterns

- How this skill applies to caelundas, lexico, etc.

## Troubleshooting

- Common issues and solutions

## Related Documentation

- Links to AGENTS.md files and other skills
```

## Using Skills

### For AI Agents

Skills are automatically loaded based on the **description** field in the frontmatter. When a user's request matches a skill's domain, the agent should:

1. **Read the skill file** using the file path from the skills list
2. **Apply the patterns** documented in the skill
3. **Follow best practices** and workflows outlined
4. **Reference related documentation** for deeper context

### For Developers

Skills serve as:

- **Quick reference guides** for common workflows
- **Onboarding documentation** for new technologies
- **Best practices catalog** for the monorepo
- **Troubleshooting guides** with common solutions

## Adding New Skills

1. **Create skill directory:**

   ```bash
   mkdir documentation/skills/new-skill
   ```

2. **Create SKILL.md file:**

   ```bash
   touch documentation/skills/new-skill/SKILL.md
   ```

3. **Add frontmatter and content:**

   ```markdown
   ---
   name: new-skill
   description: When to use this skill
   license: MIT
   ---

   # Skill Name

   [Content following the format above]
   ```

4. **Update this README** with the new skill entry

No additional symlink setup needed - the folder-level symlinks at `.github/skills` and `.claude/skills` automatically include all new skills.

## Maintenance

### Updating Skills

When updating skills:

- Keep examples current with latest project patterns
- Update tool names/parameters if MCP servers change
- Add new workflows as they emerge
- Remove deprecated patterns

### Verifying Symlinks

Check the symlinks are working:

```bash
# Verify GitHub Copilot symlink
test -L .github/skills && echo "✓ GitHub Copilot symlink exists" || echo "✗ No symlink"
test -f .github/skills/mcp-shadcn/SKILL.md && echo "✓ GitHub Copilot can access skills" || echo "✗ Cannot access"

# Verify Claude Code symlink
test -L .claude/skills && echo "✓ Claude Code symlink exists" || echo "✗ No symlink"
test -f .claude/skills/mcp-shadcn/SKILL.md && echo "✓ Claude Code can access skills" || echo "✗ Cannot access"
```

### Skill Coverage

Current coverage by category:

- ✅ **Domain-specific**: 4 skills (caelundas, lexico, generators)
- ✅ **Infrastructure**: 2 skills (K8s, Docker)
- ✅ **MCP Servers**: 6 skills (shadcn, Supabase, Chrome, Figma, Terraform, GitHub)
- ✅ **Processes**: 4 skills (commits, pull requests, CI/CD, branch naming)

**Total**: 16 skills

## Related Documentation

- [AGENTS.md](../AGENTS.md) - Main monorepo architecture guide
- [applications/caelundas/AGENTS.md](../../applications/caelundas/AGENTS.md) - caelundas architecture
- [applications/lexico/AGENTS.md](../../applications/lexico/AGENTS.md) - lexico architecture
- [packages/lexico-components/AGENTS.md](../../packages/lexico-components/AGENTS.md) - Component library
- [infrastructure/AGENTS.md](../../infrastructure/AGENTS.md) - Infrastructure overview
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Contribution guidelines

## Questions or Improvements

If you find:

- Missing skills that would be helpful
- Outdated information in existing skills
- Errors or unclear documentation
- Opportunities for better organization

Please:

1. Create an issue describing the improvement
2. Or submit a PR with the changes
3. Or ask an AI agent to update the documentation

## License

All skill files are licensed under MIT unless otherwise specified in their frontmatter.
