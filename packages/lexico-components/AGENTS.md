# Lexico Components: Shared React Component Library

## Architecture Overview

lexico-components is a shared React component library for the monorepo, providing a consistent design system and reusable UI primitives built on top of shadcn/ui and Radix UI. It follows the shadcn/ui philosophy: components are copied into your project rather than installed as a dependency, but in this monorepo context, they're copied into this shared package.

### Technology Stack

- **UI Primitives**: Radix UI (accessible, unstyled components)
- **Styling**: Tailwind CSS with CSS variables for theming
- **Component System**: shadcn/ui (New York style)
- **Type Safety**: TypeScript 5.9 with strict mode
- **Build**: Vite library mode with TypeScript declarations
- **Icon Library**: Lucide React

### Design Philosophy

#### Component Ownership Model

- **`src/components/ui/`**: **NEVER modify these files directly** - managed by shadcn CLI
- **`src/components/`**: Custom components built on ui/ primitives (safe to create/edit)
- **`src/hooks/`**: Reusable React hooks (safe to create/edit)
- **`src/lib/`**: Utilities like `cn()` for className merging (safe to edit)

**Why This Split?**

shadcn/ui is **not a traditional component library** - it's a CLI tool that generates component code. When you run `pnpx shadcn@latest add <component>`, it copies the component source into `src/components/ui/`. This means:

✅ **Pros**:

- Full control over component code (no black-box dependencies)
- Zero runtime overhead (no library wrapper)
- Easy customization (edit the source directly)
- Tree-shakeable (only bundle what you use)

⚠️ **Cons**:

- Updates require re-running CLI command (overwrites your changes)
- Must track upstream shadcn changes manually
- Convention: **Never modify ui/ files, only compose them**

#### Theming Strategy

CSS variables + Tailwind classes = flexible theming:

- Light/dark mode via `data-theme` attribute
- Color tokens: `--primary`, `--secondary`, `--accent`, `--muted`
- Component-specific tokens: `--card`, `--input`, `--popover`
- Tailwind IntelliSense: Full autocomplete for theme colors

### Component Inventory

**Shadcn UI Components** (50+ components in [src/components/ui/](src/components/ui/))

#### Layout & Structure

- Card, Separator, Resizable, Sidebar
- Accordion, Collapsible, Tabs
- Sheet (slide-over panel), Dialog (modal)

#### Form Controls

- Input, Textarea, Select, Checkbox, Radio Group, Switch, Slider
- Input OTP, Input Group, Field (form field wrapper)
- Label, Form (react-hook-form integration)

#### Navigation

- Button, Button Group, Navigation Menu, Menubar
- Breadcrumb, Pagination, Tabs
- Context Menu, Dropdown Menu, Command (cmd+k menu)

#### Feedback & Status

- Alert, Alert Dialog, Toast (Sonner)
- Badge, Spinner, Skeleton, Progress
- Tooltip, Hover Card, Popover

#### Data Display

- Table, Calendar, Chart (Recharts integration)
- Avatar, Carousel, Aspect Ratio
- Empty (empty state placeholder), Item (list item)

#### Utility

- Scroll Area, Drawer (mobile-friendly bottom sheet)
- Toggle, Toggle Group, Kbd (keyboard key display)

**Custom Hooks** ([src/hooks/](src/hooks/))

- `useMediaQuery(query)`: React hook for CSS media queries
- `useMobile()`: Detects mobile viewport (< 768px)

**Utilities** ([src/lib/](src/lib/))

- `cn(...classes)`: Merge Tailwind classes with conflict resolution (uses `clsx` + `tailwind-merge`)

### Theming System

**CSS Variables** ([src/styles/globals.css](src/styles/globals.css))

```css
:root {
  /* Light mode colors */
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --primary: 0 0% 9%;
  --primary-foreground: 0 0% 98%;
  --secondary: 0 0% 96.1%;
  --secondary-foreground: 0 0% 9%;
  --muted: 0 0% 96.1%;
  --muted-foreground: 0 0% 45.1%;
  --accent: 0 0% 96.1%;
  --accent-foreground: 0 0% 9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 0 0% 89.8%;
  --input: 0 0% 89.8%;
  --ring: 0 0% 3.9%;
  --radius: 0.5rem;
}

[data-theme="dark"] {
  /* Dark mode colors */
  --background: 0 0% 3.9%;
  --foreground: 0 0% 98%;
  /* ... other dark mode colors */
}
```

#### Using Theme Colors in Components

```tsx
// Tailwind classes map to CSS variables
<div className="bg-background text-foreground border-border">
  <button className="bg-primary text-primary-foreground hover:bg-primary/90">
    Primary Button
  </button>
</div>
```

#### Customizing Colors

1. **Edit CSS variables** in [src/styles/globals.css](src/styles/globals.css)
2. **Keep HSL format**: `hue saturation lightness` (e.g., `0 0% 9%` for dark gray)
3. **Update both light and dark modes**: Ensure contrast ratios meet WCAG standards
4. **Use opacity modifiers**: `bg-primary/50` = 50% opacity

#### Gray Base Color

shadcn config uses `gray` as base color (neutral, not warm or cool):

- Defined in [components.json](components.json): `"baseColor": "gray"`
- Used for: Backgrounds, borders, muted text, disabled states
- Alternative: `slate` (cooler), `neutral` (warmer), `zinc` (bluer)

### Adding New Components

#### Adding Shadcn Components

```bash
# Navigate to package directory
cd packages/lexico-components

# Add component from shadcn registry
pnpx shadcn@latest add <component-name>

# Examples:
pnpx shadcn@latest add dropdown-menu
pnpx shadcn@latest add command
pnpx shadcn@latest add sonner  # Toast notifications

# View available components
pnpx shadcn@latest add
```

This will:

1. Download component source to `src/components/ui/<component-name>.tsx`
2. Install required dependencies (e.g., `@radix-ui/react-dropdown-menu`)
3. Update `package.json` with new dependencies

**Exporting Components** ([src/index.ts](src/index.ts))

After adding a shadcn component, export it in the main index file:

```typescript
// src/index.ts
export * from "./components/ui/dropdown-menu";
```

#### Creating Custom Components

For project-specific components that compose ui/ primitives:

```bash
# Create in src/components/ (NOT ui/)
cd packages/lexico-components/src/components
touch word-card.tsx  # Custom component for word display
```

```tsx
// src/components/word-card.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface WordCardProps {
  word: string;
  partOfSpeech: string;
  definition: string;
}

export function WordCard({ word, partOfSpeech, definition }: WordCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{word}</CardTitle>
        <Badge variant="secondary">{partOfSpeech}</Badge>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{definition}</p>
      </CardContent>
    </Card>
  );
}
```

Then export from [src/index.ts](src/index.ts):

```typescript
export * from "./components/word-card";
```

#### Component Guidelines

- **TypeScript**: All components must have typed props (no `any`)
- **Accessibility**: Use ARIA attributes, keyboard navigation, focus management
- **Responsive**: Mobile-first design, use responsive Tailwind classes
- **Dark Mode**: Test in both light and dark themes
- **Documentation**: Add JSDoc comments for complex components

### Usage in Applications

#### Import from Monorepo Package

```tsx
// In applications/lexico/src/routes/example.tsx
import { Button, Card, Input } from '@monorepo/lexico-components';

function ExamplePage() {
  return (
    <Card>
      <Input placeholder="Search..." />
      <Button>Submit</Button>
    </Card>
  );
}
```

#### Import Styles

Root layout must import global styles:

```tsx
// In applications/lexico/src/routes/__root.tsx
import '@monorepo/lexico-components/styles/globals.css';
```

#### TypeScript Path Mapping

Monorepo uses path alias defined in [tsconfig.base.json](../../tsconfig.base.json):

```json
{
  "compilerOptions": {
    "paths": {
      "@monorepo/lexico-components": ["packages/lexico-components/src/index.ts"]
    }
  }
}
```

### Shadcn Configuration

**components.json** ([components.json](components.json))

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",           // Component style variant
  "rsc": false,                  // React Server Components (disabled)
  "tsx": true,                   // Use TypeScript
  "tailwind": {
    "config": "tailwind.config.cjs",
    "css": "src/styles/globals.css",
    "baseColor": "gray",         // Base color for neutral shades
    "cssVariables": true,        // Use CSS variables for theming
    "prefix": ""                 // No class prefix (e.g., tw-)
  },
  "iconLibrary": "lucide",       // Lucide React icons
  "aliases": {                   // Path aliases (for shadcn CLI)
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

#### Style Variants

shadcn offers two style variants:

- **default**: Minimalist, flat design (tailwind-first)
- **new-york**: Slightly more styled, shadowed, rounded (this package uses this)

#### Updating Shadcn Components

When shadcn releases updates:

```bash
# Re-add component to get latest version (overwrites existing)
pnpx shadcn@latest add <component-name>

# Review changes with git diff
git diff src/components/ui/<component-name>.tsx

# Test thoroughly - breaking changes may occur
nx run lexico-components:typecheck
```

⚠️ **Warning**: This will overwrite any manual edits to ui/ files (another reason to never edit them)

### Development Workflows

#### Local Development

This package is a library, not a standalone app - develop in context of consuming applications:

```bash
# Make changes in lexico-components
cd packages/lexico-components
# Edit src/components/ui/button.tsx

# Test changes in consuming app (lexico)
cd ../../applications/lexico
nx run lexico:develop

# Changes to lexico-components trigger hot reload in lexico
```

#### Building Library

```bash
nx run lexico-components:build
# Outputs: dist/packages/lexico-components/
```

Build creates:

- Bundled JavaScript (`index.js`)
- TypeScript declarations (`index.d.ts`)
- CSS bundle (`styles.css`)

#### Type Checking

```bash
nx run lexico-components:typecheck
```

Strict mode enabled: All props must be typed, no implicit any

#### Type Coverage

```bash
nx run lexico-components:type-coverage
# Target: 99.84% (very high bar)
```

#### Bundle Size Analysis

```bash
nx run lexico-components:build
nx run lexico-components:bundlesize
# Limit: 25 KB gzipped
```

Size limit enforced via size-limit in [package.json](package.json)

### Performance Optimization

#### Tree Shaking

Only imported components are bundled in consuming apps:

```tsx
// This only bundles Button and Card, not the entire library
import { Button, Card } from '@monorepo/lexico-components';
```

#### Code Splitting

Large components can be lazy-loaded:

```tsx
import { lazy } from 'react';
const Chart = lazy(() => import('@monorepo/lexico-components').then(m => ({ default: m.Chart })));
```

#### CSS Optimization

Tailwind purges unused styles in production:

- Scans all component files for class names
- Removes unused CSS (reduces file size by ~95%)
- Configured in [tailwind.config.cjs](tailwind.config.cjs)

### Accessibility Standards

#### WCAG Compliance

All components follow WCAG 2.1 Level AA guidelines:

- Keyboard navigation: Tab, Enter, Space, Arrow keys
- Focus management: Visible focus indicators, logical tab order
- ARIA attributes: `aria-label`, `aria-describedby`, `aria-expanded`
- Color contrast: 4.5:1 for text, 3:1 for UI components

#### Radix UI Benefits

Radix UI primitives handle accessibility automatically:

- Focus trapping in dialogs/modals
- Roving focus in menus/tabs
- Screen reader announcements
- Keyboard shortcuts (e.g., Escape to close)

#### Testing Accessibility

- Manual: Test with keyboard only (no mouse)
- Automated: Use axe DevTools browser extension
- Screen reader: Test with VoiceOver (macOS), NVDA (Windows)

## Common Patterns

### Variant-Based Components

Use `class-variance-authority` (CVA) for variant patterns:

```tsx
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
```

#### Composition Pattern

Build complex components by composing primitives:

```tsx
// Good: Composable, flexible
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Content</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>

// Avoid: Monolithic component with all props
<Card
  title="Title"
  description="Description"
  content={<p>Content</p>}
  footer={<Button>Action</Button>}
/>
```

#### Polymorphic Components

Use `asChild` prop for rendering as different element:

```tsx
// Button rendered as <a> tag (for links)
<Button asChild>
  <a href="/page">Go to page</a>
</Button>

// Uses Radix Slot component internally
import { Slot } from "@radix-ui/react-slot";

export function Button({ asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp {...props} />;
}
```

## Troubleshooting

### Component Import Errors

```typescript
// Error: Cannot find module '@monorepo/lexico-components'
// Solution: Verify tsconfig.json includes path mapping
{
  "compilerOptions": {
    "paths": {
      "@monorepo/lexico-components": ["../../packages/lexico-components/src/index.ts"]
    }
  }
}

// Also ensure component is exported in src/index.ts
export * from "./components/ui/button";
```

#### Styles Not Applied

```tsx
// Error: Components render but have no styling
// Solution: Import global CSS in root layout
import '@monorepo/lexico-components/styles/globals.css';
```

#### Dark Mode Not Working

```tsx
// Error: Dark mode classes don't apply
// Solution: Set data-theme attribute on root element
document.documentElement.setAttribute('data-theme', 'dark');

// Or use next-themes for automatic theme switching
import { ThemeProvider } from 'next-themes';

<ThemeProvider attribute="data-theme" defaultTheme="system">
  {children}
</ThemeProvider>
```

#### Shadcn CLI Fails

```bash
# Error: "Could not find components.json"
# Solution: Run from package directory, not monorepo root
cd packages/lexico-components
pnpx shadcn@latest add button

# Error: "Invalid style"
# Solution: Check components.json has correct style value
{
  "style": "new-york"  // Must be "default" or "new-york"
}
```

#### Type Errors After Adding Components

```bash
# Error: TypeScript can't find component types
# Solution: Restart TypeScript server in VSCode
# Cmd+Shift+P → "TypeScript: Restart TS Server"

# Or rebuild package
nx run lexico-components:build
```

#### Bundle Size Exceeds Limit

```bash
# Error: Bundle size 30 KB (limit: 25 KB)
# Solution: Analyze bundle, remove unused components
nx run lexico-components:build
nx run lexico-components:bundlesize

# Check which components are large
npx vite-bundle-visualizer dist/packages/lexico-components/index.js
```

## Related Documentation

- [Main AGENTS.md](../../AGENTS.md): Monorepo architecture, TypeScript conventions, Nx workflows
- [lexico AGENTS.md](../../applications/lexico/AGENTS.md): Consuming application that uses this library
- [shadcn/ui Documentation](https://ui.shadcn.com/docs): Component reference, CLI usage
- [Radix UI Documentation](https://www.radix-ui.com/primitives): Primitive component APIs
- [Tailwind CSS Documentation](https://tailwindcss.com/docs): Utility classes, configuration
- [Class Variance Authority](https://cva.style/docs): Variant-based component patterns
