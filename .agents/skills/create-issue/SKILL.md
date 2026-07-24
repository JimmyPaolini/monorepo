---
name: create-issue
description: Create GitHub issues from a plan or request using the GitHub CLI. Use when turning discussion into a tracked issue with a clear title, body, labels, and assignee.
license: MIT
---

# Create GitHub Issue

This skill teaches how to create a GitHub issue from the current conversation or an implementation plan. Keep the issue focused, actionable, and easy to triage.

## When to Use This Skill

- Converting a plan into a GitHub issue
- Capturing a task that should be tracked outside the current conversation
- Creating a simple issue with a title, body, and labels
- Assigning the issue to the current user

## Issue Creation Rules

1. Decide the issue title from the clearest user-facing outcome.
2. Write a short body that explains the goal, scope, and any important notes.
3. Add only the most relevant labels. Prefer a small label set.
4. Assign the issue to the user who requested it by using the current authenticated account.
5. Keep the issue description concise unless the task clearly needs extra detail.

## Recommended Body Structure

Use a short Markdown body with these sections when useful:

- Summary: one sentence describing the issue
- Context: why the issue matters or where it came from
- Acceptance criteria: the smallest useful checklist
- References: links to plans, PRs, or documentation

## GitHub CLI Workflow

Use the GitHub CLI to create the issue.

```bash
gh issue create \
  --title "<issue title>" \
  --body "<issue body>" \
  --label "<label-1>" \
  --label "<label-2>" \
  --assignee @me
```

## Decision Guidance

- If the request is clearly derived from a plan, use the plan title or plan goal as the issue title.
- If the request is ambiguous, choose the shortest title that still communicates the outcome.
- If labels are not obvious, use only labels that match the work type or affected area.
- If the body needs structure, keep it to three short sections at most.

## Output Expectations

- Create the GitHub issue successfully.
- Return the issue number and URL.
- Summarize the title, labels, and assignee used.
- Mention any assumptions if the request did not fully specify the content.
