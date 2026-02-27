# Tools - Nx Workspace Utilities

This directory contains Nx plugins and generators for the monorepo.

## Available Generators

### Code Generator (`code-generator`)

**Purpose:** Generate React components with test files following monorepo conventions

**Quick Start:**

```bash
nx build code-generator
nx generate code-generator:component --name=Button
```

**Features:**

- React component with TypeScript
- Vitest test file
- Barrel exports (optional)
- Auto-formatted code
- Monorepo conventions

**Documentation:**

- [README.md](./code-generator/README.md) - Plugin overview and usage

**Example Usage:**

```bash
# Basic component
nx generate code-generator:component --name=Button

# With custom directory
nx generate code-generator:component \
  --name=FormInput \
  --directory=src/components/form

# Without barrel export
nx generate code-generator:component \
  --name=Modal \
  --export=direct
```

## Adding New Generators

To add more generators to this workspace:

1. Create new generator directory: `tools/new-generator/`
2. Follow the structure of `code-generator`
3. Define schema, templates, and implementation
4. Register in `generators.json`
5. Build and test

See [tools/code-generator/AGENTS.md](./code-generator/AGENTS.md) for detailed generator development patterns.

## Project Structure

```text
tools/
├── code-generator/          # React component generator
│   ├── src/
│   │   └── generators/
│   ├── package.json
│   ├── generators.json
│   ├── AGENTS.md
│   └── README.md
└── (more generators as needed)
```

## Building Generators

```bash
# Build specific generator
nx build code-generator

# Watch mode
nx build code-generator --watch
```

## Using in Projects

### In lexico-components

```bash
nx generate code-generator:component \
  --name=Button \
  --directory=packages/lexico-components/src/components
```

### In lexico App

```bash
nx generate code-generator:component \
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
5. **Document thoroughly** - README + AGENTS.md
6. **Follow monorepo conventions** - See [AGENTS.md](../AGENTS.md)

## Troubleshooting

**Generator not found?**

```bash
nx build code-generator
nx reset
nx generate code-generator:component --name=Test
```

**Build failed?**

```bash
# Check dependencies
pnpm install

# Rebuild with verbose output
nx build code-generator --verbose
```

**Template syntax issues?**

- Use `<%= variable %>` for substitution
- `<%= name %>` for component name
- File extensions: `__name__.tsx__template__` → `ComponentName.tsx`

## References

- [Nx Generators Documentation](https://nx.dev/docs/extending-nx/intro)
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

**Current Generators:** 1 (code-generator)
