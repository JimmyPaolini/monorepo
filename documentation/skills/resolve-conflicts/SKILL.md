---
name: resolve-conflicts
description: Workflow to resolve Git merge conflicts cleanly. Use when asked to resolve conflicts, fix merge issues, merge a branch, or rebase with conflicts. This skill instructs the agent to analyze both branches to understand their distinct purposes before resolving conflicts to preserve the intent of both.
---

# Resolve Merge Conflicts

## When to Use This Skill
- When asked to "resolve merge conflicts" or "fix conflicts".
- When a merge or rebase operation halts due to conflicting changes.
- When integrating a target branch into the current branch requires reconciling overlapping code.

## Prerequisites
- A Git repository with unmerged paths, or ready to initiate a merge.
- Access to the terminal to run `git` commands.

## Step-by-Step Workflow

When invoked to resolve conflicts, follow these exact steps sequentially:

### 1. Analyze Current Branch Purpose
Examine the changes on the current branch or pull request to understand what it is trying to achieve.
- Review recent commits (`git log`) or the diff against the merge base.
- **Goal:** Grasp the core intent of the current work so it is not accidentally overwritten or lost.

### 2. Analyze Target Branch Purpose
Examine the changes that have gone into the other branch (the one being merged in) to understand its purpose.
- Look at the incoming commits or diffs.
- **Goal:** Understand what the target branch introduced (e.g., a bug fix, refactor, or new feature) so it is properly integrated alongside the current branch's changes.

### 3. Initiate Merge and Resolve Conflicts
Start the merge (if not already started) and resolve the merge conflicts.
- Identify files with conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`).
- Resolve each conflict carefully. Ensure that the resolution preserves the current branch/pull request's purpose while successfully integrating the structural or functional changes from the other branch.
- Edit the files to remove conflict markers and synthesize the correct final code.
- Mark conflicts as resolved using `git add <file>`.

### 4. Summarize Resolutions
Once all conflicts are resolved, provide the user with a comprehensive summary containing:
1. **Current Branch Purpose:** A brief explanation of the current branch/PR's goal.
2. **Target Branch Purpose:** A brief explanation of the other branch's goal.
3. **Conflicts Resolved:** A list of all conflicts encountered.
4. **Resolution Reasoning:** How each conflict was resolved and *why* that specific resolution was chosen to satisfy the intent of both branches.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Unclear intent | If the purpose of either branch is ambiguous, ask the user for clarification before attempting to resolve the code. |
| Complex structural conflicts | If a file was heavily refactored on one branch and modified on the other, take time to map the modifications to the new structure before resolving. |
| Overwhelming number of conflicts | If there are too many conflicts to handle reliably in one go, ask the user if they want to tackle them file-by-file or abort (`git merge --abort`). |
