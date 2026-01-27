# Plan: Enhance Monorepo Documentation for Agents

The monorepo has excellent convention/tooling documentation but lacks architectural context and project-specific guides. The main AGENTS.md only covers Nx basics. Priority additions include project-level AGENTS.md files (caelundas, lexico, lexico-components, infrastructure, tools), comprehensive README files for each project, new skills for Kubernetes/Supabase/ephemeris workflows, and architectural decision records with diagrams explaining the "why" behind technical choices.

## Steps

1. **Expand AGENTS.md** with monorepo architecture decisions, TypeScript path mappings strategy, dependency graph explanation, and link to project-specific AGENTS.md files.

2. **Create applications/caelundas/AGENTS.md and README.md** documenting the ephemeris pipeline, NASA API integration patterns, SQLite caching strategy, K8s deployment workflow, astronomical domain concepts, usage examples, and configuration options. Include data flow diagram (NASA API → Cache → Events → Output).

3. **Create applications/lexico/AGENTS.md and README.md** covering Supabase architecture, TanStack Start SSR patterns, authentication flow (OAuth → cookies → RLS), database schema/migrations, server function strategies, and getting started guide. Include authentication flow diagram and database schema documentation.

4. **Create packages/lexico-components/AGENTS.md and README.md** explaining component library philosophy, shadcn integration rules ("never modify ui/"), theming system (CSS variables), adding new components workflow, usage examples, and API reference.

5. **Create infrastructure/AGENTS.md and README.md** covering Helm chart usage patterns, Terraform state management, Kubernetes deployment workflows, Docker image strategies, and infrastructure-as-code best practices. Include deployment pipeline diagram.

6. **Create tools/code-generator/AGENTS.md** documenting generator development patterns, template syntax, creating new generator types, and extending the generator framework (note: README.md already exists and is excellent).

7. **Add priority skills** to .github/skills: kubernetes-deployment, supabase-development, tanstack-start-ssr, ephemeris-pipeline, docker-workflows, code-generator-patterns with symlinks to documentation.

8. **Create scripts/README.md** cataloging all utility scripts with usage instructions and inline documentation improvements for K8s scripts.

## Diagrams to Include

- **caelundas**: Ephemeris data flow diagram (NASA API → SQLite Cache → Event Detection → iCal/JSON Output)
- **lexico**: Authentication flow diagram (OAuth providers → Supabase Auth → Cookies → RLS policies)
- **lexico**: Database schema diagram (tables, relationships, RPC functions)
- **infrastructure**: Deployment pipeline diagram (Docker build → GHCR → K8s → Helm upgrade)

## Research Summary

### Current Documentation State

**Main Repository Documentation**

- AGENTS.md (Root): Very minimal - only contains Nx MCP tool guidelines
- Skills (.github/skills/): commit-messages (89% complete), github-actions (excellent coverage)
- Documentation Folder: commit-messages.md, github-actions.md, static-analysis-tools.md (14 tools), vitest.md, semantic-release.md, gitmoji.md, branch-names.md, abbreviations.md
- Project READMEs: caelundas (3 lines only), JimmyPaolini (portfolio, not technical), lexico (missing), lexico-components (missing)
- Copilot Instructions: Comprehensive monorepo overview with project specifics

### Projects Overview

**caelundas** (Astronomical Calendar CLI)

- Tech Stack: Node.js, TypeScript, Vitest, Docker, Kubernetes, Helm
- Domain: NASA JPL Horizons API, ephemeris calculations, astronomical events
- Infrastructure: Docker build → K8s job → Helm upgrade → PVC file retrieval
- Database: SQLite caching
- Testing: 3 types (unit, integration, end-to-end)
- Complex calculations: aspects, stelliums, phases, eclipses, retrogrades
- Output: iCalendar and JSON formats

**lexico** (Latin Dictionary Web App)

- Tech Stack: TanStack Start (SSR), React 19, Supabase, TypeScript, Tailwind
- Database: PostgreSQL via Supabase with RLS policies
- Features: Search (Latin/English), bookmarks, user library, authentication, pronunciation (AWS Polly)
- Infrastructure: Supabase migrations, Edge Functions, SSR with cookie-based auth
- Patterns: Server functions, file-based routing, type-generated database schema

**lexico-components** (Shared Component Library)

- Tech Stack: React 19, shadcn/ui (New York style), Tailwind, Radix UI primitives
- 40+ UI components
- Design System: CSS variables for theming, gray base color
- Convention: Never modify ui/ directory (shadcn-managed)

### Documentation Gaps by Category

**Architecture Gaps**

- Monorepo-Level: Why Nx? Dependency graph explanation. Shared TypeScript path mappings strategy. Performance optimization strategies.
- caelundas-Specific: NASA API integration guide. SQLite caching strategy. Ephemeris data flow. Event detection algorithms. Why Docker/K8s for CLI? PVC data persistence patterns.
- lexico-Specific: Supabase architecture overview. Authentication flow diagram. Database schema documentation. Migration workflow. TanStack Start SSR patterns. Server functions strategy.
- lexico-components: Component library architecture. shadcn integration philosophy. When to add custom components. Theming system explanation.

**Workflow Gaps**

- Development: First contribution guide. Local environment setup per project. Debugging workflows. Testing strategy guide. Mock/stub patterns.
- Deployment: caelundas K8s deployment guide. lexico Supabase deployment flow. Environment variable management. Secrets management. Rollback procedures.
- Infrastructure: Terraform state management. Helm chart versioning. Docker image registry management. K8s cluster setup. Monitoring setup.

**Project-Specific Gaps**

- caelundas: Usage examples. Configuration options (.env). Output format specs. Performance characteristics. Event types catalog. Troubleshooting guide.
- lexico: Getting started guide. Database seeding. RPC function documentation. Edge Function local development. AWS Polly integration.
- lexico-components: Component API reference. Usage examples. Customization guide. Accessibility best practices. Adding new shadcn components workflow.

**Tooling Gaps**

- scripts/ directory lacks README
- K8s utility scripts need inline documentation
- No guide for creating new generator types
- Nx caching strategy explanation
- Affected command troubleshooting

### Recommendations

**New AGENTS.md Locations (Priority 1)**

1. applications/caelundas/AGENTS.md - Ephemeris pipeline, NASA API, K8s deployment, astronomical concepts, caching
2. applications/lexico/AGENTS.md - Supabase integration, TanStack Start SSR, authentication, database schema/migrations
3. packages/lexico-components/AGENTS.md - Component library philosophy, shadcn integration, theming, adding components
4. infrastructure/AGENTS.md - Helm charts, Terraform, K8s patterns, Docker strategies
5. tools/code-generator/AGENTS.md - Generator patterns, template syntax, creating new generators

**New AGENTS.md Locations (Priority 2)**

6. applications/lexico/supabase/AGENTS.md - Migration workflow, RLS policies, Edge Functions, database seeding

**New Skills Topics (Priority 1)**

1. kubernetes-deployment - Helm upgrades, PVC management, job patterns
2. supabase-development - Migrations, RLS, Edge Functions, type generation
3. tanstack-start-ssr - Server functions, routing, SSR patterns
4. ephemeris-pipeline - NASA API, caching, event detection
5. docker-workflows - Multi-stage builds, GHCR, platform targeting
6. code-generator-patterns - Creating generators, template syntax, extending framework

**New Skills Topics (Priority 2)** 6. shadcn-components - Adding components, customization, maintenance 7. nx-workspace-patterns - Affected commands, caching, generators 8. testing-strategies - Unit vs integration vs e2e, mocking patterns 9. typescript-strictness - Strict mode patterns, type coverage 10. debugging-monorepo - Per-project debugging setups

**README Files to Add (Priority 1)**

- applications/caelundas/README.md (usage, configuration, deployment, troubleshooting)
- applications/lexico/README.md (getting started, architecture, deployment, local development)
- packages/lexico-components/README.md (usage, contributing, theming, component API)
- infrastructure/README.md (Helm, Terraform, K8s overview, deployment workflows)
- scripts/README.md (script catalog with descriptions and usage examples)

**README Files to Add (Priority 2)**

- applications/lexico/supabase/README.md (migrations, RLS patterns, Edge Functions, seeding)

### Summary Statistics

**Current Coverage**

- ✅ Well documented: Commit messages, GitHub Actions, static analysis, Vitest, generators
- ⚠️ Partial: Main README, CONTRIBUTING, Copilot instructions
- ❌ Missing: Project-level AGENTS.md, architecture docs, workflow guides

**Gap Breakdown**

- Architecture/Design: 15+ gaps
- Workflow/Process: 12+ gaps
- Project-Specific: 18+ gaps
- Tooling/Infrastructure: 8+ gaps

**Recommended Additions**

- 6 new AGENTS.md files (Priority 1: 5, Priority 2: 1)
- 11 new skills topics (Priority 1: 6, Priority 2: 5)
- 6 new README files (Priority 1: 5, Priority 2: 1)
- 4 architecture/workflow diagrams (data flow, auth flow, schema, deployment pipeline)

The documentation is **thorough on conventions and tooling** but **lacks architectural context and project-specific guides**. The biggest opportunities are documenting the "why" and "how" of each application's implementation patterns, especially for complex domains like astronomical calculations and Supabase integration.
