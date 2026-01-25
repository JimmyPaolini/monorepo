---
name: mcp-shadcn
description: Use the shadcn MCP server to add, update, and manage shadcn/ui components. Use this skill when working with UI components in lexico-components or adding new shadcn components.
license: MIT
---

# shadcn MCP Server

This skill covers using the shadcn MCP server to manage shadcn/ui components in the monorepo, specifically for the lexico-components package.

## When to Use

Use shadcn MCP tools when:

- Adding new shadcn/ui components to lexico-components
- Updating existing shadcn components
- Checking available component versions
- Installing component dependencies
- Troubleshooting component integration issues

## Available MCP Tools

The shadcn MCP server provides these tools (prefix: `mcp_shadcn_`):

### Component Management

**`mcp_shadcn_add_component`** - Add a new shadcn/ui component

**Parameters:**

- `component_name` (required): Name of the component to add (e.g., 'button', 'dialog', 'dropdown-menu')
- `project_path` (optional): Path to project directory (defaults to current directory)
- `overwrite` (optional): Overwrite existing component files (default: false)

**Example usage:**

```typescript
// Add a new button component
mcp_shadcn_add_component({
  component_name: "button",
  project_path: "packages/lexico-components",
});

// Add dialog and overwrite if exists
mcp_shadcn_add_component({
  component_name: "dialog",
  project_path: "packages/lexico-components",
  overwrite: true,
});
```

**`mcp_shadcn_list_components`** - List available shadcn/ui components

**Parameters:**

- `project_path` (optional): Path to project directory

**Example usage:**

```typescript
// List all available components
mcp_shadcn_list_components({
  project_path: "packages/lexico-components",
});
```

**`mcp_shadcn_update_component`** - Update an existing component

**Parameters:**

- `component_name` (required): Name of the component to update
- `project_path` (optional): Path to project directory

**Example usage:**

```typescript
// Update button component to latest version
mcp_shadcn_update_component({
  component_name: "button",
  project_path: "packages/lexico-components",
});
```

## Workflow Patterns

### Adding a New Component

1. **Check available components:**

   ```typescript
   mcp_shadcn_list_components({
     project_path: "packages/lexico-components",
   });
   ```

2. **Add the component:**

   ```typescript
   mcp_shadcn_add_component({
     component_name: "card",
     project_path: "packages/lexico-components",
   });
   ```

3. **Verify installation:**
   - Check `packages/lexico-components/src/components/ui/card.tsx` exists
   - Verify dependencies added to `package.json`
   - Ensure imports work in your code

4. **Export the component:**
   Add to `packages/lexico-components/src/index.ts`:

   ```typescript
   export {
     Card,
     CardHeader,
     CardTitle,
     CardContent,
   } from "./components/ui/card";
   ```

### Updating Existing Components

1. **Identify outdated components:**
   - Check shadcn changelog for updates
   - Review component issues

2. **Update the component:**

   ```typescript
   mcp_shadcn_update_component({
     component_name: "button",
     project_path: "packages/lexico-components",
   });
   ```

3. **Test changes:**
   - Run type checking: `nx run lexico-components:typecheck`
   - Test in consuming apps: `nx run lexico:develop`
   - Verify visual changes in Storybook (if available)

### Adding Multiple Components

```typescript
// Add multiple related components
const components = ["dialog", "alert-dialog", "sheet"];

for (const component of components) {
  mcp_shadcn_add_component({
    component_name: component,
    project_path: "packages/lexico-components",
  });
}
```

## Project-Specific Configuration

### lexico-components Setup

The lexico-components package is configured for shadcn/ui with:

**components.json:**

```json
{
  "style": "new-york",
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/styles/globals.css",
    "baseColor": "gray"
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

**Key settings:**

- **Style:** New York (modern, minimal design)
- **Base color:** Gray (neutral palette)
- **Path aliases:** `@/components`, `@/lib/utils`

### File Locations

Components are added to:

```text
packages/lexico-components/
  src/
    components/
      ui/                    # shadcn components (DO NOT MANUALLY EDIT)
        button.tsx
        dialog.tsx
        ...
      custom/                # Custom components (safe to edit)
        MyComponent.tsx
    lib/
      utils.ts              # shadcn utilities
    styles/
      globals.css           # Tailwind directives
```

## Important Rules

### ⚠️ Never Manually Edit UI Components

**DO NOT modify files in `packages/lexico-components/src/components/ui/`**

These files are managed by shadcn CLI and will be overwritten on updates.

**Instead:**

1. **Extend components** by wrapping them:

   ```tsx
   // packages/lexico-components/src/components/custom/MyButton.tsx
   import { Button } from "../ui/button";

   export function MyButton(props) {
     return (
       <Button
         className="custom-styles"
         {...props}
       />
     );
   }
   ```

2. **Use composition** to create variants:

   ```tsx
   // packages/lexico-components/src/components/custom/PrimaryButton.tsx
   import { Button } from "../ui/button";
   import { cn } from "@/lib/utils";

   export function PrimaryButton({ className, ...props }) {
     return (
       <Button
         className={cn("bg-primary text-primary-foreground", className)}
         {...props}
       />
     );
   }
   ```

3. **Add to custom directory:**

   ```text
   packages/lexico-components/src/components/custom/
   ```

### Post-Installation Steps

After adding components:

1. **Export in index.ts:**

   ```typescript
   // packages/lexico-components/src/index.ts
   export * from "./components/ui/button";
   export * from "./components/ui/dialog";
   ```

2. **Update package.json if needed:**
   Some components require additional dependencies (e.g., `@radix-ui/react-dialog`)

3. **Run type checking:**

   ```bash
   nx run lexico-components:typecheck
   ```

4. **Test in consuming applications:**

   ```bash
   nx run lexico:develop
   ```

## Common Components

### Form Components

- `button` - Button element with variants
- `input` - Text input field
- `textarea` - Multi-line text input
- `select` - Dropdown select menu
- `checkbox` - Checkbox input
- `radio-group` - Radio button group
- `switch` - Toggle switch
- `slider` - Range slider
- `label` - Form label

### Layout Components

- `card` - Content container with header/footer
- `separator` - Visual divider
- `accordion` - Expandable content sections
- `tabs` - Tabbed interface
- `sheet` - Slide-out panel
- `dialog` - Modal dialog
- `alert-dialog` - Confirmation dialog

### Feedback Components

- `alert` - Alert message
- `toast` - Notification popup
- `badge` - Status indicator
- `progress` - Progress bar
- `skeleton` - Loading placeholder

### Navigation Components

- `dropdown-menu` - Dropdown menu
- `navigation-menu` - Navigation bar
- `menubar` - Menu bar
- `breadcrumb` - Breadcrumb navigation
- `pagination` - Page navigation

### Data Display

- `table` - Data table
- `avatar` - User avatar
- `tooltip` - Hover tooltip
- `popover` - Popup content
- `calendar` - Date picker calendar

## Troubleshooting

### Component Not Found

**Error:** `Component 'xyz' not found`

**Solution:**

1. List available components:

   ```typescript
   mcp_shadcn_list_components({
     project_path: "packages/lexico-components",
   });
   ```

2. Check component name spelling
3. Verify shadcn/ui version supports the component

### Import Errors

**Error:** `Cannot find module '@/components/ui/button'`

**Solution:**

1. Verify component was added successfully
2. Check TypeScript path mappings in `tsconfig.json`:

   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./src/*"]
       }
     }
   }
   ```

3. Restart TypeScript server in VS Code

### Dependency Conflicts

**Error:** `Conflicting peer dependencies`

**Solution:**

1. Check component dependencies:

   ```bash
   cat packages/lexico-components/package.json
   ```

2. Update Radix UI packages:

   ```bash
   pnpm update @radix-ui/react-* --filter lexico-components
   ```

3. Resolve conflicts manually

### Style Issues

**Problem:** Component styles not applying

**Solution:**

1. Verify Tailwind CSS is configured:

   ```bash
   cat packages/lexico-components/tailwind.config.ts
   ```

2. Check globals.css imports Tailwind:

   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

3. Ensure CSS is imported in entry point

### Overwrite Existing Components

**Problem:** Component exists but needs updating

**Solution:**
Use `overwrite: true`:

```typescript
mcp_shadcn_add_component({
  component_name: "button",
  project_path: "packages/lexico-components",
  overwrite: true,
});
```

## Best Practices

1. **Always use MCP tools** instead of manual `npx shadcn` commands
2. **Check available components** before adding
3. **Never edit UI directory** - extend components instead
4. **Export new components** in index.ts immediately
5. **Test after adding** components in consuming apps
6. **Update regularly** to get bug fixes and improvements
7. **Use consistent style** (New York for this monorepo)
8. **Document custom components** that wrap shadcn components
9. **Follow naming conventions** (PascalCase for components)
10. **Group related components** when adding multiple

## Integration with lexico

When adding components used by lexico:

1. **Add to lexico-components:**

   ```typescript
   mcp_shadcn_add_component({
     component_name: "dialog",
     project_path: "packages/lexico-components",
   });
   ```

2. **Export component:**

   ```typescript
   // packages/lexico-components/src/index.ts
   export * from "./components/ui/dialog";
   ```

3. **Use in lexico:**

   ```tsx
   // applications/lexico/app/components/MyDialog.tsx
   import {
     Dialog,
     DialogContent,
     DialogHeader,
   } from "@monorepo/lexico-components";

   export function MyDialog() {
     return (
       <Dialog>
         <DialogContent>
           <DialogHeader>Title</DialogHeader>
         </DialogContent>
       </Dialog>
     );
   }
   ```

4. **Test integration:**

   ```bash
   nx run lexico:develop
   ```

## Related Documentation

- [packages/lexico-components/AGENTS.md](../../packages/lexico-components/AGENTS.md) - Component library architecture
- [packages/lexico-components/README.md](../../packages/lexico-components/README.md) - Usage guide
- [shadcn/ui Documentation](https://ui.shadcn.com/) - Official shadcn/ui docs
- [Radix UI Documentation](https://www.radix-ui.com/) - Primitive component docs

## See Also

- **supabase-development skill** - For backend integration
- **tanstack-start-ssr skill** - For SSR patterns with components
- **github-actions skill** - For CI/CD testing of components
