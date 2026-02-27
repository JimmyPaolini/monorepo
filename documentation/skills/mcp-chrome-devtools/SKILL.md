---
name: mcp-chrome-devtools
description: Use the Chrome DevTools MCP server for browser debugging, performance profiling, and runtime inspection. Use this skill when debugging web applications or analyzing frontend performance.
license: MIT
---

# Chrome DevTools MCP Server

This skill covers using the Chrome DevTools Protocol (CDP) via MCP to debug, profile, and inspect web applications running in Chrome or Chromium browsers.

## When to Use

Use Chrome DevTools MCP tools when:

- Debugging JavaScript runtime errors in lexico
- Profiling frontend performance
- Analyzing network requests and responses
- Inspecting DOM structure and CSS
- Monitoring console logs in real-time
- Taking screenshots or PDFs of pages
- Testing responsive designs
- Analyzing memory usage
- Debugging service workers or web workers

## Available MCP Tools

The Chrome DevTools MCP server provides these tools (prefix: `mcp_chrome_`):

### Page Navigation

**`mcp_chrome_navigate`** - Navigate to a URL

**Parameters:**

- `url` (required): URL to navigate to
- `wait_until` (optional): Wait for 'load', 'domcontentloaded', 'networkidle'

**Example usage:**

```typescript
mcp_chrome_navigate({
  url: "http://localhost:3000",
  wait_until: "networkidle",
});
```

### DOM Inspection

**`mcp_chrome_get_document`** - Get the page DOM structure

**Example usage:**

```typescript
const dom = mcp_chrome_get_document();
```

**`mcp_chrome_query_selector`** - Find elements by CSS selector

**Parameters:**

- `selector` (required): CSS selector
- `node_id` (optional): Parent node to search within

**Example usage:**

```typescript
// Find all buttons
mcp_chrome_query_selector({
  selector: "button",
});

// Find element within specific node
mcp_chrome_query_selector({
  selector: ".modal .submit-button",
  node_id: modalNodeId,
});
```

**`mcp_chrome_get_attributes`** - Get element attributes

**Parameters:**

- `node_id` (required): DOM node ID

**Example usage:**

```typescript
mcp_chrome_get_attributes({
  node_id: nodeId,
});
```

### JavaScript Execution

**`mcp_chrome_evaluate`** - Execute JavaScript in page context

**Parameters:**

- `expression` (required): JavaScript code to execute
- `return_by_value` (optional): Return result by value (default: true)

**Example usage:**

```typescript
// Get page title
mcp_chrome_evaluate({
  expression: "document.title",
});

// Call function
mcp_chrome_evaluate({
  expression: "window.myFunction(42)",
});

// Return complex object
mcp_chrome_evaluate({
  expression: "JSON.stringify({ users: getUsers() })",
});
```

### Console Monitoring

**`mcp_chrome_get_console_logs`** - Retrieve console messages

**Example usage:**

```typescript
const logs = mcp_chrome_get_console_logs();
// Returns: Array of { level, text, timestamp, url, lineNumber }
```

**`mcp_chrome_clear_console`** - Clear console messages

**Example usage:**

```typescript
mcp_chrome_clear_console();
```

### Network Monitoring

**`mcp_chrome_get_network_logs`** - Get network request logs

**Example usage:**

```typescript
const requests = mcp_chrome_get_network_logs();
// Returns: Array of { url, method, status, responseTime, size }
```

**`mcp_chrome_set_user_agent`** - Change user agent string

**Parameters:**

- `user_agent` (required): User agent string

**Example usage:**

```typescript
// Mobile user agent
mcp_chrome_set_user_agent({
  user_agent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
});
```

### Screenshots & PDFs

**`mcp_chrome_screenshot`** - Capture page screenshot

**Parameters:**

- `format` (optional): 'png' or 'jpeg' (default: 'png')
- `quality` (optional): JPEG quality 0-100
- `full_page` (optional): Capture full scrollable page (default: false)
- `clip` (optional): Capture specific region { x, y, width, height }

**Example usage:**

```typescript
// Full page screenshot
mcp_chrome_screenshot({
  format: "png",
  full_page: true,
});

// Specific element region
mcp_chrome_screenshot({
  format: "jpeg",
  quality: 90,
  clip: { x: 100, y: 100, width: 800, height: 600 },
});
```

**`mcp_chrome_pdf`** - Generate PDF of page

**Parameters:**

- `landscape` (optional): Landscape orientation
- `print_background` (optional): Include backgrounds
- `scale` (optional): Scale 0.1-2.0
- `paper_width` (optional): Paper width in inches
- `paper_height` (optional): Paper height in inches

**Example usage:**

```typescript
mcp_chrome_pdf({
  landscape: false,
  print_background: true,
  scale: 1.0,
  paper_width: 8.5,
  paper_height: 11,
});
```

### Performance Profiling

**`mcp_chrome_start_profiling`** - Start CPU profiling

**Example usage:**

```typescript
mcp_chrome_start_profiling();
// ... perform actions ...
const profile = mcp_chrome_stop_profiling();
```

**`mcp_chrome_stop_profiling`** - Stop CPU profiling and get results

**Example usage:**

```typescript
const profile = mcp_chrome_stop_profiling();
// Analyze profile.nodes, profile.samples
```

**`mcp_chrome_get_metrics`** - Get performance metrics

**Example usage:**

```typescript
const metrics = mcp_chrome_get_metrics();
// Returns: { Timestamp, Documents, Frames, JSEventListeners, Nodes, ... }
```

### Viewport & Device Emulation

**`mcp_chrome_set_viewport`** - Set viewport size

**Parameters:**

- `width` (required): Viewport width
- `height` (required): Viewport height
- `device_scale_factor` (optional): Device pixel ratio
- `mobile` (optional): Mobile mode

**Example usage:**

```typescript
// Desktop viewport
mcp_chrome_set_viewport({
  width: 1920,
  height: 1080,
  device_scale_factor: 1,
});

// Mobile viewport
mcp_chrome_set_viewport({
  width: 375,
  height: 667,
  device_scale_factor: 2,
  mobile: true,
});
```

## Workflow Patterns

### Debugging lexico Application

1. **Start local dev server:**

   ```bash
   nx run lexico:develop
   ```

2. **Navigate to application:**

   ```typescript
   mcp_chrome_navigate({
     url: "http://localhost:3000",
     wait_until: "networkidle",
   });
   ```

3. **Check console for errors:**

   ```typescript
   const logs = mcp_chrome_get_console_logs();
   const errors = logs.filter((log) => log.level === "error");
   ```

4. **Inspect specific element:**

   ```typescript
   const nodes = mcp_chrome_query_selector({
     selector: ".search-input",
   });
   ```

5. **Execute test code:**

   ```typescript
   mcp_chrome_evaluate({
     expression: 'window.searchWords("amor")',
   });
   ```

### Performance Analysis

1. **Start profiling:**

   ```typescript
   mcp_chrome_start_profiling();
   ```

2. **Perform actions:**

   ```typescript
   mcp_chrome_evaluate({
     expression: `
       document.querySelector('.search-button').click();
     `,
   });
   ```

3. **Stop and analyze:**

   ```typescript
   const profile = mcp_chrome_stop_profiling();
   // Analyze hot functions, bottlenecks
   ```

4. **Get metrics:**

   ```typescript
   const metrics = mcp_chrome_get_metrics();
   console.log("Nodes:", metrics.Nodes);
   console.log("JS Heap:", metrics.JSHeapUsedSize);
   ```

### Visual Regression Testing

1. **Set consistent viewport:**

   ```typescript
   mcp_chrome_set_viewport({
     width: 1280,
     height: 720,
     device_scale_factor: 1,
   });
   ```

2. **Navigate to page:**

   ```typescript
   mcp_chrome_navigate({
     url: "http://localhost:3000/word/amor",
     wait_until: "networkidle",
   });
   ```

3. **Take screenshot:**

   ```typescript
   const screenshot = mcp_chrome_screenshot({
     format: "png",
     full_page: true,
   });
   ```

4. **Compare with baseline:**

   ```typescript
   // Use image comparison library
   const diff = compareImages(screenshot, baselineImage);
   ```

### Mobile Testing

1. **Set mobile viewport:**

   ```typescript
   mcp_chrome_set_viewport({
     width: 375,
     height: 812, // iPhone X
     device_scale_factor: 3,
     mobile: true,
   });
   ```

2. **Set mobile user agent:**

   ```typescript
   mcp_chrome_set_user_agent({
     user_agent:
       "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15",
   });
   ```

3. **Test touch interactions:**

   ```typescript
   mcp_chrome_evaluate({
     expression: `
       const button = document.querySelector('.mobile-menu');
       button.dispatchEvent(new TouchEvent('touchstart'));
     `,
   });
   ```

### Network Analysis

1. **Navigate and monitor:**

   ```typescript
   mcp_chrome_navigate({
     url: "http://localhost:3000",
   });
   ```

2. **Get network logs:**

   ```typescript
   const requests = mcp_chrome_get_network_logs();
   ```

3. **Analyze requests:**

   ```typescript
   const slowRequests = requests.filter((r) => r.responseTime > 1000);
   const failedRequests = requests.filter((r) => r.status >= 400);
   const largeRequests = requests.filter((r) => r.size > 1000000);
   ```

## Project-Specific Usage

### lexico Application

**Test search functionality:**

```typescript
// Navigate to search page
mcp_chrome_navigate({
  url: "http://localhost:3000/search",
  wait_until: "networkidle",
});

// Enter search query
mcp_chrome_evaluate({
  expression: `
    document.querySelector('input[name="q"]').value = 'amor';
    document.querySelector('form').submit();
  `,
});

// Wait for results
await new Promise((resolve) => setTimeout(resolve, 1000));

// Check results
const results = mcp_chrome_evaluate({
  expression: 'document.querySelectorAll(".search-result").length',
});
```

**Test authentication flow:**

```typescript
// Navigate to login
mcp_chrome_navigate({
  url: "http://localhost:3000/login",
});

// Click OAuth provider
mcp_chrome_evaluate({
  expression: 'document.querySelector(".google-login").click()',
});

// Monitor console for auth errors
const logs = mcp_chrome_get_console_logs();
const authErrors = logs.filter(
  (log) => log.text.includes("auth") && log.level === "error",
);
```

**Performance check:**

```typescript
mcp_chrome_start_profiling();

// Navigate to word detail page
mcp_chrome_navigate({
  url: "http://localhost:3000/word/amor",
  wait_until: "networkidle",
});

const profile = mcp_chrome_stop_profiling();
const metrics = mcp_chrome_get_metrics();

console.log("Page load profile:", profile);
console.log("Memory metrics:", metrics);
```

## Common Use Cases

### Debugging TypeScript Errors

```typescript
// Run application
nx run lexico:develop

// Navigate to page
mcp_chrome_navigate({
  url: 'http://localhost:3000',
  wait_until: 'load'
})

// Check for errors
const logs = mcp_chrome_get_console_logs()
const errors = logs.filter(l => l.level === 'error')

for (const error of errors) {
  console.log(`Error at ${error.url}:${error.lineNumber}`)
  console.log(error.text)
}
```

### Testing Responsive Design

```typescript
const breakpoints = [
  { name: "Mobile", width: 375, height: 667 },
  { name: "Tablet", width: 768, height: 1024 },
  { name: "Desktop", width: 1920, height: 1080 },
];

for (const bp of breakpoints) {
  mcp_chrome_set_viewport({
    width: bp.width,
    height: bp.height,
  });

  mcp_chrome_navigate({
    url: "http://localhost:3000",
    wait_until: "networkidle",
  });

  const screenshot = mcp_chrome_screenshot({
    full_page: true,
  });

  // Save screenshot with name
  saveScreenshot(screenshot, `${bp.name}.png`);
}
```

### Monitoring Memory Leaks

```typescript
// Get initial metrics
mcp_chrome_navigate({ url: "http://localhost:3000" });
const initialMetrics = mcp_chrome_get_metrics();

// Perform actions multiple times
for (let i = 0; i < 100; i++) {
  mcp_chrome_evaluate({
    expression: `
      // Simulate user interaction
      document.querySelector('.search-button').click();
    `,
  });
  await new Promise((resolve) => setTimeout(resolve, 100));
}

// Get final metrics
const finalMetrics = mcp_chrome_get_metrics();

// Check for memory growth
const heapGrowth = finalMetrics.JSHeapUsedSize - initialMetrics.JSHeapUsedSize;
const nodeGrowth = finalMetrics.Nodes - initialMetrics.Nodes;

if (heapGrowth > 10000000) {
  console.warn("Potential memory leak detected");
}
```

## Troubleshooting

**Chrome not connected:**

- Ensure Chrome is running with remote debugging enabled
- Check CDP endpoint is accessible
- Verify firewall settings

**Viewport not applying:**

- Set viewport before navigation
- Use device emulation for mobile testing
- Check if page overrides viewport with meta tags

**Screenshot empty:**

- Wait for page to load completely
- Check if element is visible
- Ensure viewport is set correctly

**Evaluate returns undefined:**

- Check if expression is valid JavaScript
- Verify return value is serializable
- Use `JSON.stringify()` for complex objects

**Console logs missing:**

- Enable console monitoring before navigation
- Check if logs are cleared by application
- Filter by log level

## Best Practices

1. **Wait for page load** before interacting
2. **Set viewport consistently** for reproducible tests
3. **Clear console** between test runs
4. **Monitor network** to catch API errors
5. **Use query selectors** instead of XPath
6. **Evaluate JavaScript safely** with try-catch
7. **Take screenshots** for visual verification
8. **Profile sparingly** - impacts performance
9. **Clean up** after debugging sessions
10. **Test multiple viewports** for responsive design

## Security Considerations

- **Never run untrusted code** in browser context
- **Sanitize user input** before evaluating
- **Avoid exposing sensitive data** in screenshots
- **Use local development only** - don't debug production
- **Secure CDP endpoint** if exposed remotely

## Related Documentation

- [applications/lexico/AGENTS.md](../../applications/lexico/AGENTS.md) - Lexico architecture
- [tanstack-start-ssr skill](../tanstack-start-ssr/SKILL.md) - SSR debugging patterns
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/) - Official CDP docs

## See Also

- **tanstack-start-ssr skill** - For SSR debugging
- **github-actions skill** - For CI/CD with browser testing
- **mcp-supabase skill** - For backend debugging
