#!/bin/bash
#
# sessionStart hook — validates the current git branch name.
#
#   - Silent when the branch follows <type>/<scope>-<description>
#   - Injects the validate-branch-name errorMsg + rename-branch skill directive
#     as additionalContext when non-compliant
#

# 🔎 Current branch

BRANCH=$(git branch --show-current 2>/dev/null)
# Detached HEAD or non-git directory — nothing to validate
[ -z "$BRANCH" ] && exit 0

# ✅ Validation

# Extract just the errorMsg block from validate-branch-name output, stripping
# ANSI codes. Empty output means the branch is compliant — exit silently.
ERROR=$(pnpm exec validate-branch-name 2>&1 | awk '/^Error Msg:/{found=1; next} found && /^Branch Name:/{exit} found{print}' | sed 's/\x1b\[[0-9;]*m//g')
[ -z "$ERROR" ] && exit 0

# 📋 Context

# Combine the human-readable error (types, scopes, format) with a directive so
# Copilot invokes the rename-branch skill before responding to the user.
CONTEXT="$ERROR
🚨 Invoke the rename-branch skill to rename this branch before doing anything else."

printf '%s' "$CONTEXT" | node -e "
const chunks = [];
process.stdin.on('data', d => chunks.push(d));
process.stdin.on('end', () => process.stdout.write(JSON.stringify({ additionalContext: chunks.join('') })));
"
