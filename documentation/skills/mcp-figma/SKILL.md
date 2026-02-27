---
name: mcp-figma
description: Use the Figma MCP server to access design files, extract assets, and sync design tokens. Use this skill when working with Figma designs or implementing UI components.
license: MIT
---

# Figma MCP Server

This skill covers using the Figma MCP server to interact with Figma design files, extract design specifications, download assets, and sync design tokens with the codebase.

## When to Use

Use Figma MCP tools when:

- Implementing UI components from Figma designs
- Extracting design specifications (colors, typography, spacing)
- Downloading design assets (icons, images)
- Verifying component implementation matches designs
- Syncing design tokens from Figma to code
- Creating documentation from Figma files
- Auditing design system usage

## Available MCP Tools

The Figma MCP server provides these tools (prefix: `mcp_figma_`):

### File Operations

**`mcp_figma_get_file`** - Get Figma file contents

**Parameters:**

- `file_key` (required): Figma file key from URL
- `version` (optional): Specific file version
- `depth` (optional): Tree depth to fetch (default: all)

**Example usage:**

```typescript
// Get full file
mcp_figma_get_file({
  file_key: "ABC123XYZ",
});

// Get specific version
mcp_figma_get_file({
  file_key: "ABC123XYZ",
  version: "1234567890",
});
```

**`mcp_figma_get_file_nodes`** - Get specific nodes from file

**Parameters:**

- `file_key` (required): Figma file key
- `node_ids` (required): Array of node IDs

**Example usage:**

```typescript
mcp_figma_get_file_nodes({
  file_key: "ABC123XYZ",
  node_ids: ["123:456", "789:012"],
});
```

### Component Operations

**`mcp_figma_get_components`** - Get component information

**Parameters:**

- `file_key` (required): Figma file key

**Example usage:**

```typescript
const components = mcp_figma_get_components({
  file_key: "ABC123XYZ",
});
// Returns: { components: { [key]: { name, description, ... } } }
```

**`mcp_figma_get_component_sets`** - Get component variants

**Parameters:**

- `file_key` (required): Figma file key

**Example usage:**

```typescript
const variants = mcp_figma_get_component_sets({
  file_key: "ABC123XYZ",
});
```

### Style Operations

**`mcp_figma_get_styles`** - Get style definitions

**Parameters:**

- `file_key` (required): Figma file key

**Example usage:**

```typescript
const styles = mcp_figma_get_styles({
  file_key: "ABC123XYZ",
});
// Returns: { fills, strokes, effects, text, grids }
```

### Image Operations

**`mcp_figma_get_images`** - Export images from nodes

**Parameters:**

- `file_key` (required): Figma file key
- `node_ids` (required): Array of node IDs
- `format` (optional): 'png', 'jpg', 'svg', 'pdf' (default: 'png')
- `scale` (optional): 1, 2, 3, 4 (default: 1)

**Example usage:**

```typescript
// Export as PNG
mcp_figma_get_images({
  file_key: "ABC123XYZ",
  node_ids: ["123:456"],
  format: "png",
  scale: 2,
});

// Export as SVG
mcp_figma_get_images({
  file_key: "ABC123XYZ",
  node_ids: ["789:012"],
  format: "svg",
});
```

### Comments Operations

**`mcp_figma_get_comments`** - Get file comments

**Parameters:**

- `file_key` (required): Figma file key

**Example usage:**

```typescript
const comments = mcp_figma_get_comments({
  file_key: "ABC123XYZ",
});
```

**`mcp_figma_post_comment`** - Add comment to file

**Parameters:**

- `file_key` (required): Figma file key
- `message` (required): Comment text
- `node_id` (optional): Node to comment on

**Example usage:**

```typescript
mcp_figma_post_comment({
  file_key: "ABC123XYZ",
  message: "Implemented button component",
  node_id: "123:456",
});
```

## Workflow Patterns

### Implementing Components from Figma

1. **Get component specifications:**

   ```typescript
   const file = mcp_figma_get_file({
     file_key: "ABC123XYZ",
   });

   // Find button component
   const buttonNode = file.document.children
     .find((page) => page.name === "Components")
     .children.find((component) => component.name === "Button");
   ```

2. **Extract design tokens:**

   ```typescript
   const styles = mcp_figma_get_styles({
     file_key: "ABC123XYZ",
   });

   // Parse color styles
   const colors = styles.fills.map((fill) => ({
     name: fill.name,
     value: rgbToHex(fill.color),
   }));
   ```

3. **Download assets:**

   ```typescript
   const images = mcp_figma_get_images({
     file_key: "ABC123XYZ",
     node_ids: ["icon-node-id"],
     format: "svg",
   });
   ```

4. **Implement component:**

   ```tsx
   // packages/lexico-components/src/components/Button.tsx
   import { Button as ShadcnButton } from "./ui/button";

   export function Button({ variant, size, children }) {
     // Implementation matching Figma specs
     return (
       <ShadcnButton
         variant={variant}
         size={size}
       >
         {children}
       </ShadcnButton>
     );
   }
   ```

5. **Comment on Figma:**

   ```typescript
   mcp_figma_post_comment({
     file_key: "ABC123XYZ",
     message: "Button component implemented in lexico-components",
     node_id: buttonNode.id,
   });
   ```

### Syncing Design Tokens

1. **Get style definitions:**

   ```typescript
   const styles = mcp_figma_get_styles({
     file_key: "ABC123XYZ",
   });
   ```

2. **Parse colors:**

   ```typescript
   const colorTokens = styles.fills.reduce((acc, fill) => {
     const name = fill.name.toLowerCase().replace(/\s+/g, "-");
     const value = rgbToHex(fill.color);
     acc[name] = value;
     return acc;
   }, {});
   ```

3. **Update Tailwind config:**

   ```typescript
   // packages/lexico-components/tailwind.config.ts
   export default {
     theme: {
       extend: {
         colors: {
           ...colorTokens,
         },
       },
     },
   };
   ```

4. **Update CSS variables:**

   ```css
   /* packages/lexico-components/src/styles/globals.css */
   :root {
     --primary: 210 100% 50%;
     --secondary: 200 50% 60%;
     /* ... other tokens from Figma */
   }
   ```

### Extracting Icon Assets

1. **Find icon frames:**

   ```typescript
   const file = mcp_figma_get_file({
     file_key: "ABC123XYZ",
   });

   const iconPage = file.document.children.find(
     (page) => page.name === "Icons",
   );

   const iconNodeIds = iconPage.children.map((node) => node.id);
   ```

2. **Export as SVG:**

   ```typescript
   const svgs = mcp_figma_get_images({
     file_key: "ABC123XYZ",
     node_ids: iconNodeIds,
     format: "svg",
   });
   ```

3. **Save to project:**

   ```typescript
   for (const [nodeId, url] of Object.entries(svgs.images)) {
     const node = iconPage.children.find((n) => n.id === nodeId);
     const filename = node.name.toLowerCase().replace(/\s+/g, "-");

     // Download and save SVG
     await downloadAndSave(
       url,
       `packages/lexico-components/assets/icons/${filename}.svg`,
     );
   }
   ```

## Project-Specific Usage

### lexico-components Integration

**Extract component library design:**

```typescript
// Get lexico-components Figma file
const file = mcp_figma_get_file({
  file_key: "lexico-components-file-key",
});

// Get all components
const components = mcp_figma_get_components({
  file_key: "lexico-components-file-key",
});

// Parse component hierarchy
const componentTree = buildComponentTree(file.document);
```

**Sync shadcn customizations:**

```typescript
// Get button variants from Figma
const buttonVariants = mcp_figma_get_file_nodes({
  file_key: "lexico-components-file-key",
  node_ids: ["button-default", "button-primary", "button-outline"],
});

// Extract style specifications
const buttonStyles = buttonVariants.nodes.map((node) => ({
  variant: node.name,
  backgroundColor: node.fills[0].color,
  textColor: node.children[0].fills[0].color,
  padding: node.paddingLeft,
  borderRadius: node.cornerRadius,
}));
```

### lexico Application Design

**Get page layouts:**

```typescript
const file = mcp_figma_get_file({
  file_key: "lexico-app-file-key",
});

// Find search page design
const searchPage = file.document.children
  .find((page) => page.name === "Pages")
  .children.find((frame) => frame.name === "Search");

// Extract layout specifications
const layout = {
  width: searchPage.absoluteBoundingBox.width,
  height: searchPage.absoluteBoundingBox.height,
  padding: searchPage.paddingLeft,
  gap: searchPage.itemSpacing,
};
```

## Design Token Conversion

### Color Conversion

```typescript
function rgbToHex(color: { r: number; g: number; b: number }): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// Figma RGB (0-1) to hex
const hex = rgbToHex({ r: 0.2, g: 0.4, b: 0.8 });
// Result: '#3366cc'
```

### Typography Conversion

```typescript
function figmaTypographyToCSS(textStyle: FigmaTextStyle) {
  return {
    fontFamily: textStyle.fontFamily,
    fontSize: `${textStyle.fontSize}px`,
    fontWeight: textStyle.fontWeight,
    lineHeight: `${textStyle.lineHeightPx}px`,
    letterSpacing: `${textStyle.letterSpacing}px`,
  };
}
```

### Spacing Conversion

```typescript
function extractSpacingScale(file: FigmaFile) {
  // Find spacing tokens in Figma
  const spacingPage = file.document.children.find(
    (page) => page.name === "Tokens/Spacing",
  );

  const spacingTokens = spacingPage.children.reduce((acc, node) => {
    const name = node.name.replace("spacing/", "");
    acc[name] = node.absoluteBoundingBox.width;
    return acc;
  }, {});

  return spacingTokens;
}
```

## Common Use Cases

### Component Audit

```typescript
// Get all components in Figma
const figmaComponents = mcp_figma_get_components({
  file_key: "ABC123XYZ",
});

// Get all components in code
const codeComponents = listCodeComponents("packages/lexico-components");

// Find missing implementations
const missing = Object.keys(figmaComponents.components).filter(
  (name) => !codeComponents.includes(name),
);

console.log("Components not yet implemented:", missing);
```

### Design Version History

```typescript
// Get file versions
const file = mcp_figma_get_file({
  file_key: "ABC123XYZ",
});

const currentVersion = file.version;

// Get previous version
const previousFile = mcp_figma_get_file({
  file_key: "ABC123XYZ",
  version: currentVersion - 1,
});

// Compare changes
const changes = compareFiles(previousFile, file);
```

### Asset Export Pipeline

```typescript
async function exportAllAssets(fileKey: string) {
  // Get file structure
  const file = mcp_figma_get_file({ file_key: fileKey });

  // Find assets page
  const assetsPage = file.document.children.find(
    (page) => page.name === "Assets",
  );

  if (!assetsPage) return;

  // Export each asset
  for (const node of assetsPage.children) {
    const images = mcp_figma_get_images({
      file_key: fileKey,
      node_ids: [node.id],
      format: node.name.endsWith(".svg") ? "svg" : "png",
      scale: 2,
    });

    // Download and save
    for (const [nodeId, url] of Object.entries(images.images)) {
      const filename = node.name;
      await downloadAndSave(url, `assets/${filename}`);
    }
  }
}
```

## Troubleshooting

**Permission denied:**

- Verify Figma access token is valid
- Check file sharing permissions
- Request editor access for commenting

**Node not found:**

- Verify node ID is correct
- Check if node was deleted
- Use get_file to find current nodes

**Image export fails:**

- Check format is supported
- Verify node contains exportable content
- Try reducing scale factor

**Style parsing errors:**

- Check if styles are published
- Verify style type matches expected format
- Handle missing or null values

## Best Practices

1. **Cache file data** to reduce API calls
2. **Version control design tokens** in git
3. **Automate token sync** with CI/CD
4. **Document Figma file structure** in README
5. **Use consistent naming** between Figma and code
6. **Export assets in multiple formats** (SVG + PNG)
7. **Comment implementation status** in Figma
8. **Set up webhooks** for design updates
9. **Validate tokens** before committing
10. **Keep design system files organized**

## Security Considerations

- **Protect Figma access tokens** - never commit to git
- **Use read-only tokens** when possible
- **Limit file access** to team members only
- **Audit token usage** regularly
- **Rotate tokens** periodically

## Related Documentation

- [packages/lexico-components/AGENTS.md](../../packages/lexico-components/AGENTS.md) - Component library
- [mcp-shadcn skill](../mcp-shadcn/SKILL.md) - shadcn component management
- [Figma API Documentation](https://www.figma.com/developers/api) - Official Figma API docs

## See Also

- **mcp-shadcn skill** - For component implementation
- **github-actions skill** - For automated design sync
