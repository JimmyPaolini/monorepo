---
name: mcp-github
description: Use the GitHub MCP server for repository operations, PR management, issues, and workflows. Use this skill when working with GitHub repositories programmatically.
license: MIT
---

# GitHub MCP Server

This skill covers using the GitHub MCP server to interact with GitHub repositories, manage pull requests, issues, workflows, and other GitHub features programmatically.

## When to Use

Use GitHub MCP tools when:

- Creating or updating pull requests
- Managing issues and labels
- Triggering GitHub Actions workflows
- Reviewing code changes
- Managing repository settings
- Querying repository data
- Automating GitHub workflows
- Syncing repository information

**Note:** Many GitHub MCP tools are already documented in the instructions. This skill provides additional context and usage patterns.

## Available Tool Categories

The GitHub MCP server provides extensive tools (prefix: `mcp_github_`):

### Repository Operations

- `mcp_github_create_repository` - Create new repository
- `mcp_github_get_file_contents` - Read repository files
- `mcp_github_create_or_update_file` - Write files
- `mcp_github_delete_file` - Remove files
- `mcp_github_push_files` - Batch file operations
- `mcp_github_list_branches` - List branches
- `mcp_github_create_branch` - Create branch

### Pull Request Management

- `mcp_github_create_pull_request` - Create PR
- `mcp_github_update_pull_request` - Update PR
- `mcp_github_list_pull_requests` - List PRs
- `mcp_github_pull_request_read` - Get PR details
- `mcp_github_pull_request_review_write` - Create reviews
- `mcp_github_add_comment_to_pending_review` - Add review comments
- `mcp_github_merge_pull_request` - Merge PR
- `mcp_github_update_pull_request_branch` - Update PR branch

### Issue Management

- `mcp_github_issue_write` - Create/update issues
- `mcp_github_issue_read` - Get issue details
- `mcp_github_list_issues` - List issues
- `mcp_github_search_issues` - Search issues
- `mcp_github_add_issue_comment` - Comment on issues

### Workflow & Actions

- `mcp_github_list_commits` - List repository commits
- `mcp_github_get_commit` - Get commit details
- `mcp_github_search_code` - Search code
- `mcp_github_search_repositories` - Search repos

See the GitHub instructions in your context for complete tool documentation.

## Workflow Patterns

### Creating Pull Requests

1. **Create feature branch:**

   ```typescript
   mcp_github_create_branch({
     owner: "JimmyPaolini",
     repo: "monorepo",
     branch: "feat/new-feature",
     from_branch: "main",
   });
   ```

2. **Make changes:**

   ```typescript
   mcp_github_push_files({
     owner: "JimmyPaolini",
     repo: "monorepo",
     branch: "feat/new-feature",
     files: [
       {
         path: "packages/lexico-components/src/components/NewButton.tsx",
         content: buttonComponentCode,
       },
       {
         path: "packages/lexico-components/src/index.ts",
         content: updatedExports,
       },
     ],
     message: "feat(lexico-components): add new button component",
   });
   ```

3. **Create pull request:**

   ```typescript
   const pr = mcp_github_create_pull_request({
     owner: "JimmyPaolini",
     repo: "monorepo",
     title: "feat(lexico-components): add new button component",
     head: "feat/new-feature",
     base: "main",
     body: "Adds a new button component to lexico-components.",
     draft: false,
   });
   ```

### Code Review Workflow

1. **Get PR details:**

   ```typescript
   const prDetails = mcp_github_pull_request_read({
     method: "get",
     owner: "JimmyPaolini",
     repo: "monorepo",
     pullNumber: 42,
   });
   ```

2. **Get PR diff:**

   ```typescript
   const diff = mcp_github_pull_request_read({
     method: "get_diff",
     owner: "JimmyPaolini",
     repo: "monorepo",
     pullNumber: 42,
   });
   ```

3. **Create review:**

   ```typescript
   mcp_github_pull_request_review_write({
     method: "create",
     owner: "JimmyPaolini",
     repo: "monorepo",
     pullNumber: 42,
     body: "Reviewing the implementation...",
     event: "COMMENT", // Don't submit yet
   });
   ```

4. **Add review comments:**

   ```typescript
   mcp_github_add_comment_to_pending_review({
     owner: "JimmyPaolini",
     repo: "monorepo",
     pullNumber: 42,
     path: "packages/lexico-components/src/components/NewButton.tsx",
     body: "Consider adding prop validation here",
     line: 15,
     side: "RIGHT",
     subjectType: "LINE",
   });
   ```

5. **Submit review:**

   ```typescript
   mcp_github_pull_request_review_write({
     method: "submit_pending",
     owner: "JimmyPaolini",
     repo: "monorepo",
     pullNumber: 42,
     body: "Looks good! Just a few minor suggestions.",
     event: "APPROVE",
   });
   ```

### Issue Operations

1. **Create issue:**

   ```typescript
   const issue = mcp_github_issue_write({
     method: "create",
     owner: "JimmyPaolini",
     repo: "monorepo",
     title: "Add dark mode support to lexico-components",
     body: "Add dark mode theming support to all components.",
     labels: ["enhancement", "lexico-components"],
     assignees: ["JimmyPaolini"],
   });
   ```

2. **Update issue:**

   ```typescript
   mcp_github_issue_write({
     method: "update",
     owner: "JimmyPaolini",
     repo: "monorepo",
     issue_number: issue.number,
     state: "closed",
     state_reason: "completed",
   });
   ```

3. **Search issues:**

   ```typescript
   const bugs = mcp_github_search_issues({
     query: "repo:JimmyPaolini/monorepo is:issue is:open label:bug",
   });
   ```

### Repository File Operations

1. **Read configuration:**

   ```typescript
   const packageJson = mcp_github_get_file_contents({
     owner: "JimmyPaolini",
     repo: "monorepo",
     path: "package.json",
   });

   const config = JSON.parse(atob(packageJson.content));
   ```

2. **Update file:**

   ```typescript
   // Get current file SHA
   const file = mcp_github_get_file_contents({
     owner: "JimmyPaolini",
     repo: "monorepo",
     path: "package.json",
   });

   // Update content
   const updatedConfig = {
     ...JSON.parse(atob(file.content)),
     version: "1.2.3",
   };

   // Write back
   mcp_github_create_or_update_file({
     owner: "JimmyPaolini",
     repo: "monorepo",
     path: "package.json",
     content: JSON.stringify(updatedConfig, null, 2),
     message: "chore(monorepo): bump version to 1.2.3",
     branch: "main",
     sha: file.sha,
   });
   ```

3. **Batch updates:**

   ```typescript
   mcp_github_push_files({
     owner: "JimmyPaolini",
     repo: "monorepo",
     branch: "update-docs",
     files: [
       { path: "README.md", content: updatedReadme },
       { path: "CONTRIBUTING.md", content: updatedContributing },
       {
         path: "packages/lexico-components/README.md",
         content: componentReadme,
       },
     ],
     message: "docs: update documentation across projects",
   });
   ```

## Project-Specific Usage

### monorepo Automation

**Create documentation PR:**

```typescript
// Create branch
mcp_github_create_branch({
  owner: "JimmyPaolini",
  repo: "monorepo",
  branch: "docs/update-agents",
  from_branch: "main",
});

// Generate updated docs
const agentsDocs = generateAgentsDocumentation();

// Push changes
mcp_github_push_files({
  owner: "JimmyPaolini",
  repo: "monorepo",
  branch: "docs/update-agents",
  files: [
    { path: "AGENTS.md", content: agentsDocs.root },
    { path: "applications/caelundas/AGENTS.md", content: agentsDocs.caelundas },
    { path: "applications/lexico/AGENTS.md", content: agentsDocs.lexico },
  ],
  message: "docs: update AGENTS.md documentation",
});

// Create PR
mcp_github_create_pull_request({
  owner: "JimmyPaolini",
  repo: "monorepo",
  title: "docs: update AGENTS.md documentation",
  head: "docs/update-agents",
  base: "main",
  body: "Updates AGENTS.md files with latest architecture patterns.",
  draft: false,
});
```

**Sync with PR template:**

```typescript
// Get PR template
const template = mcp_github_get_file_contents({
  owner: "JimmyPaolini",
  repo: "monorepo",
  path: ".github/PULL_REQUEST_TEMPLATE.md",
});

// Use template for PR body
const prBody = fillPRTemplate(atob(template.content), {
  description: "Add new feature",
  changes: ["Updated component", "Added tests"],
  testing: "nx test lexico-components",
});
```

### Issue Automation

**Create issues from backlog:**

```typescript
const backlogItems = [
  {
    title: "Add pagination to search results",
    labels: ["enhancement", "lexico"],
    estimate: 5,
  },
  {
    title: "Improve ephemeris calculation performance",
    labels: ["performance", "caelundas"],
    estimate: 8,
  },
];

for (const item of backlogItems) {
  mcp_github_issue_write({
    method: "create",
    owner: "JimmyPaolini",
    repo: "monorepo",
    title: item.title,
    body: `Estimated effort: ${item.estimate} story points`,
    labels: item.labels,
  });
}
```

**Close stale issues:**

```typescript
// Find old issues
const oldIssues = mcp_github_search_issues({
  query: "repo:JimmyPaolini/monorepo is:issue is:open created:<2024-01-01",
});

// Close with comment
for (const issue of oldIssues.items) {
  mcp_github_add_issue_comment({
    owner: "JimmyPaolini",
    repo: "monorepo",
    issue_number: issue.number,
    body: "Closing due to inactivity. Please reopen if still relevant.",
  });

  mcp_github_issue_write({
    method: "update",
    owner: "JimmyPaolini",
    repo: "monorepo",
    issue_number: issue.number,
    state: "closed",
    state_reason: "not_planned",
  });
}
```

## Advanced Patterns

### Automated Release PR

```typescript
// Get last release tag
const tags = mcp_github_list_tags({
  owner: "JimmyPaolini",
  repo: "monorepo",
});

const lastTag = tags.data[0].name;

// Get commits since last release
const commits = mcp_github_list_commits({
  owner: "JimmyPaolini",
  repo: "monorepo",
  sha: "main",
});

// Generate changelog
const changelog = generateChangelog(commits, lastTag);

// Create release branch
const version = getNextVersion(lastTag);
mcp_github_create_branch({
  owner: "JimmyPaolini",
  repo: "monorepo",
  branch: `release/${version}`,
  from_branch: "main",
});

// Update version files
mcp_github_push_files({
  owner: "JimmyPaolini",
  repo: "monorepo",
  branch: `release/${version}`,
  files: [
    { path: "package.json", content: updatedPackageJson },
    { path: "CHANGELOG.md", content: changelog },
  ],
  message: `chore(monorepo): release ${version}`,
});

// Create release PR
mcp_github_create_pull_request({
  owner: "JimmyPaolini",
  repo: "monorepo",
  title: `chore(monorepo): release ${version}`,
  head: `release/${version}`,
  base: "main",
  body: changelog,
});
```

### Code Search & Refactoring

```typescript
// Find all usages of deprecated API
const results = mcp_github_search_code({
  query: "repo:JimmyPaolini/monorepo oldAPIFunction",
});

// Create refactoring PRs
for (const result of results.items) {
  const file = mcp_github_get_file_contents({
    owner: "JimmyPaolini",
    repo: "monorepo",
    path: result.path,
  });

  const updated = refactorCode(atob(file.content));

  const branchName = `refactor/${result.path.replace(/\//g, "-")}`;

  mcp_github_create_branch({
    owner: "JimmyPaolini",
    repo: "monorepo",
    branch: branchName,
    from_branch: "main",
  });

  mcp_github_create_or_update_file({
    owner: "JimmyPaolini",
    repo: "monorepo",
    path: result.path,
    content: updated,
    message: `refactor: migrate from oldAPIFunction to newAPIFunction`,
    branch: branchName,
    sha: file.sha,
  });

  mcp_github_create_pull_request({
    owner: "JimmyPaolini",
    repo: "monorepo",
    title: `refactor(${getScope(result.path)}): migrate to new API`,
    head: branchName,
    base: "main",
    body: "Automated refactoring from oldAPIFunction to newAPIFunction",
  });
}
```

## Best Practices

1. **Use descriptive PR titles** following conventional commits
2. **Include comprehensive PR descriptions** with context and testing
3. **Request reviews** from appropriate team members
4. **Label issues and PRs** for organization
5. **Close issues with references** (`Closes #123`)
6. **Use draft PRs** for work in progress
7. **Keep commits atomic** and well-described
8. **Use branch protection** for important branches
9. **Enable required reviews** before merging
10. **Clean up merged branches** automatically

## Security Considerations

- **Use fine-grained tokens** with minimal permissions
- **Never commit tokens** to repository
- **Use GitHub Apps** for organization-wide automation
- **Audit API usage** regularly
- **Rotate tokens** periodically
- **Use CODEOWNERS** for sensitive files
- **Enable branch protection** on main branches

## Troubleshooting

**Permission denied:**

- Verify token has required scopes
- Check repository permissions
- Ensure organization settings allow API access

**File conflicts:**

- Pull latest changes before updating
- Use correct SHA for file updates
- Handle merge conflicts manually

**Rate limiting:**

- Implement exponential backoff
- Cache responses when possible
- Use conditional requests (ETags)

## Related Documentation

- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Contribution guidelines
- [commit-messages skill](../commit-messages/SKILL.md) - Commit message format
- [github-actions skill](../github-actions/SKILL.md) - CI/CD workflows

## See Also

- **github-actions skill** - For workflow automation
- **commit-messages skill** - For proper commit formatting
