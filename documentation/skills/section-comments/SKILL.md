---
name: section-comments
description: Write section comments using the emoji section comment format for TypeScript, Python, and any other language. USE WHEN adding section comments, organizing code into logical groups, or when asked about comment style conventions. Covers the correct format, emoji selection, capitalization, and anti-patterns to avoid (dash lines, ASCII art, #region blocks).
license: MIT
---

# Section Comments

When a file benefits from logical groupings, mark each section with a single-line emoji comment.

## Format

```text
// <emoji> <Section name>
```

- **Emoji first** — conveys the section's purpose at a glance
- **Section name starts with a capital letter** — `// 🔧 Configuration`, not `// 🔧 configuration`
- **Single line only** — no closing marker, no surrounding dash lines
- **Python** uses `#` instead of `//` — same rules otherwise

## Examples

### TypeScript / JavaScript

```typescript
// 🔧 Configuration

const MAX_RETRIES = 3;
const API_TIMEOUT = 5_000;

// 🎭 Mocks

vi.mock("./api.js");

// 🧪 Tests

describe("MyService", () => { ... });
```

### NestJS service layout

```typescript
@Injectable()
export class MyService {
  // 🏗 Dependency injection
  constructor(private readonly logger: LoggerService) {}

  // 🔐 Private fields

  // 🔑 Public fields

  // 🔏 Private methods

  // 🌎 Public methods
}
```

### Python

```python
# 🔧 Configuration

MAX_RETRIES = 3

# 🧪 Tests

class TestMyService(unittest.TestCase): ...
```

## Emoji Reference

| Emoji | Typical use |
| ----- | ----------- |
| 🏗 | Dependency injection, constructors |
| 🔧 | Configuration, constants |
| 🗄️ | Types, data structures |
| 🔐 | Private fields |
| 🔑 | Public fields |
| 🔏 | Private methods |
| 🌎 | Public methods |
| 🎭 | Mocks |
| 🧪 | Tests |
| 🔗 | Relations, associations |
| 🏷️ | Type aliases, interfaces |
| ♟️ | Constants module |
| 🔎 | Queries |
| 🖋️ | Mutations |
| 📋 | Headings, lists |
| 📦 | Code blocks, packages |
| 📝 | Paragraphs, docs |
| 🔗 | Links |
| 🖼️ | Images |
| ✏️ | Inline formatting |
| ✅ | Completed / passing |
| ➖ | Thematic breaks |
| 💬 | Blockquotes |
| 📊 | Tables |
| 📚 | Grammar groups, large topic areas |

## Anti-Patterns

```typescript
// ❌ WRONG: dash dividers above and below
// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

// ❌ WRONG: equals dividers
// ===========================
// Configuration
// ===========================

// ❌ WRONG: lowercase section name
// 🔧 configuration

// ❌ WRONG: no emoji
// Configuration

// ❌ WRONG: #region blocks (we don't use these)
//#region 🔧 Configuration
//#endregion
```

## Rules Summary

1. Format: `// <emoji> <Section name>` (TypeScript/JS) or `# <emoji> <Section name>` (Python)
2. Section name: capitalized first letter, short noun phrase
3. Never wrap a section comment in dash lines or any other delimiter
4. Never use `#region`/`#endregion` — plain emoji comments are sufficient
5. Choose an emoji that conveys the section's purpose; consult the table above
