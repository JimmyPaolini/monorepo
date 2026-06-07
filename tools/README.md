# Tools - Nx Workspace Utilities

This directory contains Nx plugins and generators for the monorepo.

## Available Generators

### Conformance (`conformance`)

**Purpose:** Provide Nx generators and validators that enforce monorepo conventions

**Quick Start:**

```bash
nx build conformance
nx generate conformance:react-component --name=Button
```

**Features:**

- React component scaffolding
- NestJS service module scaffolding
- NestJS command application scaffolding
- TypeScript conformance validators
- Auto-formatted generated code

**Documentation:**

- [README.md](./conformance/README.md) - Plugin overview and usage

**Example Usage:**

```bash
# Basic component
nx generate conformance:react-component --name=Button

# With custom directory
nx generate conformance:react-component \
  --name=FormInput \
  --directory=src/components/form

# Without barrel export
nx generate conformance:react-component \
  --name=Modal \
  --export=direct
```

## Adding New Generators

To add more generators to this workspace:

1. Create new generator directory: `tools/new-generator/`
2. Follow the structure of `conformance`
3. Define schema, templates, and implementation
4. Register in `generators.json`
5. Build and test

See [tools/conformance/AGENTS.md](./conformance/AGENTS.md) for detailed generator development patterns.

## Project Structure

```text
tools/
├── conformance/             # Generator and validator framework
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
nx build conformance

# Watch mode
nx build conformance --watch
```

## Using in Projects

### In lexico-components

```bash
nx generate conformance:react-component \
  --name=Button \
  --directory=packages/lexico-components/src/components
```

### In lexico App

```bash
nx generate conformance:react-component \
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
nx build conformance
nx reset
nx generate conformance:react-component --name=Test
```

**Build failed?**

```bash
# Check dependencies
pnpm install

# Rebuild with verbose output
nx build conformance --verbose
```

**Template syntax issues?**

- Use Mustache syntax (`{{variable}}`) for file content substitution
- Template config files use `.mustache` suffix and are stripped in generator output

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

**Current Generators:** 1 (conformance)
