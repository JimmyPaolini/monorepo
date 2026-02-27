# Code Generator

Nx generator for creating React components with corresponding test files following the monorepo conventions.

## Usage

```bash
nx generate code-generator:component --name=my-component
nx generate code-generator:component --name=my-component --directory=src/components/ui
nx generate code-generator:component --name=my-component --export=barrel
```

## Options

- `name` (required): The name of the component (PascalCase)
- `directory` (optional): Directory where component will be created (default: src/components)
- `export` (optional): Export strategy - `direct` or `barrel` (default: barrel)

## Generated Files

For a component named `Button`:

- `src/components/Button/Button.tsx` - Component file
- `src/components/Button/Button.test.tsx` - Test file
- `src/components/Button/index.ts` - Barrel export (if export=barrel)
