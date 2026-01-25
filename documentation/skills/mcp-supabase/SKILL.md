---
name: mcp-supabase
description: Use the Supabase MCP server for database operations, authentication management, and storage operations. Use this skill when working with Supabase via MCP tools.
license: MIT
---

# Supabase MCP Server

This skill covers using the Supabase MCP server to interact with Supabase projects programmatically, managing databases, authentication, storage, and Edge Functions.

## When to Use

Use Supabase MCP tools when:

- Querying or modifying database tables
- Managing authentication users and sessions
- Uploading or downloading files from Storage
- Executing RPC functions
- Managing Edge Functions
- Monitoring real-time subscriptions
- Debugging Supabase integration issues

**Note:** For local Supabase development (migrations, type generation, etc.), use the `supabase-development` skill and Nx targets. Use MCP tools for runtime operations.

## Available MCP Tools

The Supabase MCP server provides these tools (prefix: `mcp_supabase_`):

### Database Operations

**`mcp_supabase_query`** - Execute SQL queries

**Parameters:**

- `sql` (required): SQL query to execute
- `project_ref` (optional): Supabase project reference

**Example usage:**

```typescript
// Select data
mcp_supabase_query({
  sql: "SELECT * FROM words WHERE latin LIKE $1 LIMIT 10",
  project_ref: "your-project-ref",
});

// Insert data
mcp_supabase_query({
  sql: `INSERT INTO bookmarks (user_id, word_id) VALUES ($1, $2)`,
  project_ref: "your-project-ref",
});

// Update data
mcp_supabase_query({
  sql: "UPDATE users SET last_login = NOW() WHERE id = $1",
  project_ref: "your-project-ref",
});
```

**`mcp_supabase_select`** - Select rows from a table

**Parameters:**

- `table` (required): Table name
- `columns` (optional): Columns to select (default: '\*')
- `filters` (optional): WHERE conditions
- `limit` (optional): Maximum rows to return
- `order_by` (optional): Sort order
- `project_ref` (optional): Supabase project reference

**Example usage:**

```typescript
// Select all columns
mcp_supabase_select({
  table: "words",
  limit: 10,
});

// Select specific columns with filter
mcp_supabase_select({
  table: "bookmarks",
  columns: "id, word_id, created_at",
  filters: { user_id: "user-uuid-here" },
  order_by: "created_at DESC",
});
```

**`mcp_supabase_insert`** - Insert rows into a table

**Parameters:**

- `table` (required): Table name
- `data` (required): Object or array of objects to insert
- `project_ref` (optional): Supabase project reference

**Example usage:**

```typescript
// Insert single row
mcp_supabase_insert({
  table: "bookmarks",
  data: {
    user_id: "user-uuid",
    word_id: "amor",
  },
});

// Insert multiple rows
mcp_supabase_insert({
  table: "words",
  data: [
    { latin: "amor", english: "love" },
    { latin: "vita", english: "life" },
  ],
});
```

**`mcp_supabase_update`** - Update rows in a table

**Parameters:**

- `table` (required): Table name
- `data` (required): Object with fields to update
- `filters` (required): WHERE conditions
- `project_ref` (optional): Supabase project reference

**Example usage:**

```typescript
mcp_supabase_update({
  table: "users",
  data: { last_login: new Date().toISOString() },
  filters: { id: "user-uuid" },
});
```

**`mcp_supabase_delete`** - Delete rows from a table

**Parameters:**

- `table` (required): Table name
- `filters` (required): WHERE conditions
- `project_ref` (optional): Supabase project reference

**Example usage:**

```typescript
mcp_supabase_delete({
  table: "bookmarks",
  filters: { user_id: "user-uuid", word_id: "amor" },
});
```

**`mcp_supabase_rpc`** - Call a stored procedure

**Parameters:**

- `function_name` (required): RPC function name
- `params` (optional): Function parameters
- `project_ref` (optional): Supabase project reference

**Example usage:**

```typescript
// Call RPC function
mcp_supabase_rpc({
  function_name: "search_words",
  params: {
    query: "amor",
    limit_count: 20,
  },
});
```

### Authentication Operations

**`mcp_supabase_list_users`** - List authentication users

**Parameters:**

- `page` (optional): Page number
- `per_page` (optional): Users per page
- `project_ref` (optional): Supabase project reference

**Example usage:**

```typescript
mcp_supabase_list_users({
  page: 1,
  per_page: 50,
});
```

**`mcp_supabase_get_user`** - Get user by ID

**Parameters:**

- `user_id` (required): User UUID
- `project_ref` (optional): Supabase project reference

**Example usage:**

```typescript
mcp_supabase_get_user({
  user_id: "user-uuid-here",
});
```

**`mcp_supabase_create_user`** - Create a new user

**Parameters:**

- `email` (required): User email
- `password` (required): User password
- `user_metadata` (optional): Additional metadata
- `project_ref` (optional): Supabase project reference

**Example usage:**

```typescript
mcp_supabase_create_user({
  email: "user@example.com",
  password: "secure-password",
  user_metadata: {
    name: "John Doe",
    role: "user",
  },
});
```

**`mcp_supabase_delete_user`** - Delete a user

**Parameters:**

- `user_id` (required): User UUID
- `project_ref` (optional): Supabase project reference

**Example usage:**

```typescript
mcp_supabase_delete_user({
  user_id: "user-uuid-here",
});
```

### Storage Operations

**`mcp_supabase_upload_file`** - Upload a file to Storage

**Parameters:**

- `bucket` (required): Storage bucket name
- `path` (required): File path in bucket
- `file` (required): File data (Buffer or string)
- `content_type` (optional): MIME type
- `project_ref` (optional): Supabase project reference

**Example usage:**

```typescript
mcp_supabase_upload_file({
  bucket: "avatars",
  path: "user-123/profile.jpg",
  file: fileBuffer,
  content_type: "image/jpeg",
});
```

**`mcp_supabase_download_file`** - Download a file from Storage

**Parameters:**

- `bucket` (required): Storage bucket name
- `path` (required): File path in bucket
- `project_ref` (optional): Supabase project reference

**Example usage:**

```typescript
mcp_supabase_download_file({
  bucket: "avatars",
  path: "user-123/profile.jpg",
});
```

**`mcp_supabase_delete_file`** - Delete a file from Storage

**Parameters:**

- `bucket` (required): Storage bucket name
- `path` (required): File path in bucket
- `project_ref` (optional): Supabase project reference

**Example usage:**

```typescript
mcp_supabase_delete_file({
  bucket: "avatars",
  path: "user-123/old-profile.jpg",
});
```

**`mcp_supabase_list_files`** - List files in a bucket

**Parameters:**

- `bucket` (required): Storage bucket name
- `path` (optional): Directory path (default: root)
- `project_ref` (optional): Supabase project reference

**Example usage:**

```typescript
mcp_supabase_list_files({
  bucket: "avatars",
  path: "user-123/",
});
```

## Workflow Patterns

### Database Query Pattern

1. **Check table structure:**

   ```typescript
   // Query information schema
   mcp_supabase_query({
     sql: `
       SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_name = $1
     `,
     project_ref: "your-project",
   });
   ```

2. **Query data:**

   ```typescript
   mcp_supabase_select({
     table: "words",
     columns: "id, latin, english",
     filters: { latin: { like: "am%" } },
     limit: 10,
   });
   ```

3. **Process results:**
   Handle returned data and errors appropriately

### User Management Pattern

1. **List users:**

   ```typescript
   const users = mcp_supabase_list_users({
     per_page: 100,
   });
   ```

2. **Get specific user:**

   ```typescript
   const user = mcp_supabase_get_user({
     user_id: "user-uuid",
   });
   ```

3. **Update user metadata:**

   ```typescript
   mcp_supabase_query({
     sql: `
       UPDATE auth.users
       SET raw_user_meta_data = raw_user_meta_data || $1::jsonb
       WHERE id = $2
     `,
     project_ref: "your-project",
   });
   ```

### File Upload Pattern

1. **Prepare file:**

   ```typescript
   const fileBuffer = await fs.readFile("path/to/file.jpg");
   ```

2. **Upload to Storage:**

   ```typescript
   mcp_supabase_upload_file({
     bucket: "images",
     path: `uploads/${Date.now()}-file.jpg`,
     file: fileBuffer,
     content_type: "image/jpeg",
   });
   ```

3. **Get public URL:**

   ```typescript
   mcp_supabase_query({
     sql: `
       SELECT storage.url($1, $2) as public_url
     `,
     project_ref: "your-project",
   });
   ```

## Project-Specific Usage

### lexico Application

**Search words:**

```typescript
mcp_supabase_rpc({
  function_name: "search_words",
  params: {
    query: "amor",
    limit_count: 20,
  },
  project_ref: "lexico-project-ref",
});
```

**Get user bookmarks:**

```typescript
mcp_supabase_select({
  table: "bookmarks",
  columns: "word_id, created_at",
  filters: { user_id: "user-uuid" },
  order_by: "created_at DESC",
  project_ref: "lexico-project-ref",
});
```

**Add bookmark:**

```typescript
mcp_supabase_insert({
  table: "bookmarks",
  data: {
    user_id: "user-uuid",
    word_id: "amor",
  },
  project_ref: "lexico-project-ref",
});
```

## Security Considerations

### Authentication

MCP tools use Supabase service role key for authentication. **NEVER expose service role key in client code.**

### Row Level Security (RLS)

MCP tools bypass RLS policies by default (service role). For user-scoped operations:

1. **Use RPC functions** with auth checks:

   ```sql
   CREATE FUNCTION get_user_bookmarks()
   RETURNS TABLE (...) AS $$
   BEGIN
     RETURN QUERY
     SELECT * FROM bookmarks
     WHERE user_id = auth.uid();
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

2. **Set user context** in queries:

   ```typescript
   mcp_supabase_query({
     sql: `
       SET LOCAL role TO authenticated;
       SET LOCAL request.jwt.claims TO '{"sub": "user-uuid"}';
       SELECT * FROM bookmarks;
     `,
   });
   ```

### Input Validation

Always validate inputs before passing to MCP tools:

```typescript
// ❌ Bad - SQL injection risk
const userInput = req.body.query;
mcp_supabase_query({
  sql: `SELECT * FROM words WHERE latin = '${userInput}'`,
});

// ✅ Good - Parameterized query
const userInput = req.body.query;
mcp_supabase_query({
  sql: "SELECT * FROM words WHERE latin = $1",
  params: [userInput],
});
```

## Error Handling

### Common Errors

**Permission denied:**

```typescript
try {
  await mcp_supabase_select({ table: "private_table" });
} catch (error) {
  if (error.message.includes("permission denied")) {
    // Handle RLS policy violation
  }
}
```

**Row not found:**

```typescript
const result = await mcp_supabase_select({
  table: "words",
  filters: { id: "nonexistent" },
});

if (!result.data || result.data.length === 0) {
  // Handle not found
}
```

**Unique constraint violation:**

```typescript
try {
  await mcp_supabase_insert({
    table: "bookmarks",
    data: { user_id: "uuid", word_id: "amor" },
  });
} catch (error) {
  if (error.message.includes("unique constraint")) {
    // Bookmark already exists
  }
}
```

## Performance Tips

### Use Indexes

Query performance depends on database indexes:

```sql
-- Create index for common queries
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_words_latin ON words(latin);
```

### Limit Results

Always use `limit` to prevent large result sets:

```typescript
mcp_supabase_select({
  table: "words",
  limit: 100, // Prevent fetching millions of rows
});
```

### Use RPC for Complex Queries

Instead of multiple round trips:

```typescript
// ❌ Multiple calls
const words = await mcp_supabase_select({ table: "words" });
for (const word of words.data) {
  const examples = await mcp_supabase_select({
    table: "examples",
    filters: { word_id: word.id },
  });
}

// ✅ Single RPC call
const results = await mcp_supabase_rpc({
  function_name: "get_words_with_examples",
});
```

### Batch Operations

Use array operations for bulk inserts:

```typescript
// Insert multiple rows at once
mcp_supabase_insert({
  table: "words",
  data: [
    { latin: "amor", english: "love" },
    { latin: "vita", english: "life" },
    { latin: "pax", english: "peace" },
  ],
});
```

## Troubleshooting

**Connection errors:**

- Verify project_ref is correct
- Check Supabase service role key is set
- Ensure network connectivity to Supabase

**Query timeout:**

- Optimize query with indexes
- Reduce result set size with LIMIT
- Use pagination for large datasets

**RLS policy violations:**

- Check if RLS is enabled on table
- Review policy conditions
- Use service role for admin operations

**Type mismatches:**

- Verify data types match table schema
- Cast values explicitly in SQL
- Check for NULL handling

## Best Practices

1. **Use parameterized queries** to prevent SQL injection
2. **Implement RPC functions** for complex business logic
3. **Limit result sets** to reasonable sizes
4. **Cache frequently accessed data** to reduce queries
5. **Use transactions** for multi-step operations
6. **Validate inputs** before database operations
7. **Handle errors gracefully** with proper error messages
8. **Monitor query performance** and add indexes as needed
9. **Use service role sparingly** - prefer RPC with auth checks
10. **Test queries locally** before running in production

## Related Documentation

- [supabase-development skill](../supabase-development/SKILL.md) - Local development patterns
- [applications/lexico/AGENTS.md](../../applications/lexico/AGENTS.md) - Lexico Supabase architecture
- [Supabase Documentation](https://supabase.com/docs) - Official docs

## See Also

- **tanstack-start-ssr skill** - For SSR integration with Supabase
- **github-actions skill** - For CI/CD with Supabase
