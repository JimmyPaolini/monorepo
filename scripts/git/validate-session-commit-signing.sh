#!/bin/bash
#
# sessionStart hook — validates git commit signing configuration.
#
#   - Silent when GPG signing is configured correctly
#   - Injects the signing error + stop directive as additionalContext when
#     commit signing is not configured
#

# ✅ Validation

ERROR=$(bash scripts/git/check-commit-signing-configuration.sh 2>&1 || true)
[ -z "$ERROR" ] && exit 0

# 📋 Context

CONTEXT="$ERROR
🚨 Git commit signing is required in this repository. Stop and fix the signing configuration before creating commits."

printf '%s' "$CONTEXT" | node -e "
const chunks = [];
process.stdin.on('data', d => chunks.push(d.toString()));
process.stdin.on('end', () => process.stdout.write(JSON.stringify({ additionalContext: chunks.join('') })));
"
