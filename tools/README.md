# Tools - Nx Workspace Utilities

This directory contains Nx plugins and generators for the monorepo.

## Available Generators

### Component Generator (`component-generator`)

**Purpose:** Generate React components with test files following monorepo conventions

**Quick Start:**

```bash
nx build component-generator
nx generate component-generator:component --name=Button
```

**Features:**

- ✅ React component with TypeScript
- ✅ Vitest test file
- ✅ Barrel exports (optional)
- ✅ Auto-formatted code
- ✅ Monorepo conventions

**Documentation:**

- [README.md](./component-generator/README.md) - Plugin overview
- [USAGE.md](./component-generator/USAGE.md) - Detailed usage guide
- [EXAMPLES.md](./component-generator/EXAMPLES.md) - Real-world examples
- [TESTING.md](./component-generator/TESTING.md) - Testing & troubleshooting

**Example Usage:**

```bash
# Basic component
nx generate component-generator:component --name=Button

# With custom directory
nx generate component-generator:component \
  --name=FormInput \
  --directory=src/components/form

# Without barrel export
nx generate component-generator:component \
  --name=Modal \
  --export=direct
```

## Adding New Generators

To add more generators to this workspace:

1. Create new generator directory: `tools/new-generator/`
2. Follow the structure of `component-generator`
3. Define schema, templates, and implementation
4. Register in `generators.json`
5. Build and test

Example:

```bash
# Create a hook generator
tools/hook-generator/
├── src/generators/hook/
├── generators.json
├── package.json
└── README.md
```

## Project Structure

```text
tools/
├── component-generator/     # React component generator
│   ├── src/
│   │   └── generators/
│   ├── package.json
│   ├── generators.json
│   └── README.md
└── (more generators as needed)
```

## Building Generators

```bash
# Build specific generator
nx build component-generator

# Build all generators
nx build-generators  # if you create this target

# Watch mode
nx build component-generator --watch
```

## Using in Projects

### In lexico-components

```bash
nx generate component-generator:component \
  --name=Button \
  --directory=packages/lexico-components/src/components
```

### In lexico App

```bash
nx generate component-generator:component \
  --name=HomePage \
  --directory=applications/lexico/src/components
```

## Generator Development

### Structure for New Generator

```text
tools/my-generator/
├── src/
│   ├── generators/
│   │   └── my-generator/
│   │       ├── generator.ts
│   │       ├── schema.json
│   │       ├── schema.d.ts
│   │       ├── lib/
│   │       │   ├── normalize-options.ts
│   │       │   └── helper-functions.ts
│   │       └── files/
│   │           └── template-files
│   └── index.ts
├── generators.json
├── package.json
├── project.json
└── README.md
```

### Key Generator APIs

- `generateFiles()` - Copy and process template files
- `updateJson()` - Modify JSON configuration
- `addProjectConfiguration()` - Register new projects
- `formatFiles()` - Auto-format generated code
- `installPackagesTask()` - Install dependencies

## Best Practices

1. **Always provide schemas** - Define options clearly
2. **Template everything** - Don't hardcode file content
3. **Type your generators** - Use TypeScript interfaces
4. **Include tests** - Generate valid, tested code
5. **Document thoroughly** - README, USAGE, EXAMPLES
6. **Follow monorepo conventions** - See copilot-instructions.md

## Troubleshooting

**Generator not found?**

```bash
nx build component-generator
nx reset
nx generate component-generator:component --name=Test
```

**Build failed?**

```bash
# Check dependencies
pnpm install

# Rebuild with verbose output
nx build component-generator --verbose
```

**Template syntax issues?**

- Use `<%= variable %>` for substitution
- `<%= name %>` for component name
- File extensions: `__name__.tsx__template__` → `ComponentName.tsx`

## References

- [Nx Generators Documentation](https://nx.dev/docs/extending-nx/intro)
- [Component Generator Docs](./component-generator/USAGE.md)
- [Monorepo Conventions](../.github/copilot-instructions.md)
- [Nx Plugin API](https://nx.dev/docs/extending-nx/create-sync-generator)

## Contributing

When adding new generators:

1. Create feature branch
2. Follow existing patterns
3. Add comprehensive documentation
4. Test thoroughly
5. Update this README
6. Submit PR

---

**Current Generators:** 1 (component-generator)
**Last Updated:** December 26, 2025
