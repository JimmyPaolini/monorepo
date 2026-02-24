#!/usr/bin/env bash
# Validate devcontainer tool installations and configuration.
#
# Run inside the devcontainer or the built container image:
#   bash .devcontainer/scripts/test-devcontainer.sh
#
# Exit code: 0 if all tests pass, 1 if any test fails

# No set -e: we want to collect all failures rather than stopping on the first
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# ── Expected pinned versions (kept in sync with package.json) ────────────────
NODE_MAJOR="22"
PNPM_VERSION="10.20.0"

# ── Assertion helpers ────────────────────────────────────────────────────────
PASS=0
FAIL=0

pass() {
  PASS=$((PASS + 1))
  echo "  ✅ $1"
}

fail() {
  FAIL=$((FAIL + 1))
  echo "  ❌ $1"
}

# assert_available <label> <command>
# Checks that <command> succeeds and prints its first output line.
assert_available() {
  local label="$1"
  local cmd="$2"
  local all_output first_line
  if all_output=$(eval "$cmd" 2>&1); then
    first_line=$(echo "$all_output" | head -1)
    pass "$label available: $first_line"
  else
    fail "$label not found (command: $cmd)"
  fi
}

# assert_version_contains <label> <expected_substring> <command>
# Checks that the first output line of <command> contains <expected_substring>.
assert_version_contains() {
  local label="$1"
  local expected="$2"
  local cmd="$3"
  local all_output actual
  all_output=$(eval "$cmd" 2>&1) || true
  actual=$(echo "$all_output" | head -1)
  if echo "$actual" | grep -qF "$expected"; then
    pass "$label version matches ($actual)"
  else
    fail "$label version mismatch: expected '$expected', got '$actual'"
  fi
}

# ── Tests ────────────────────────────────────────────────────────────────────

echo ""
echo "🟢 Node.js — must be v${NODE_MAJOR}.x (matches package.json engines)"
assert_version_contains "node" "v${NODE_MAJOR}." "node --version"

echo ""
echo "📦 pnpm — must be ${PNPM_VERSION} (matches package.json packageManager)"
assert_version_contains "pnpm" "${PNPM_VERSION}" "pnpm --version"

echo ""
echo "🕋 Nx CLI"
assert_available "nx" "nx --version"

echo ""
echo "🐙 GitHub CLI"
assert_available "gh" "gh --version"

echo ""
echo "⚡ Supabase CLI"
assert_available "supabase" "supabase --version"

echo ""
echo "☸️  kubectl"
assert_available "kubectl" "kubectl version --client"

echo ""
echo "⛵ Helm"
assert_available "helm" "helm version --short"

echo ""
echo "🏗️  Terraform"
assert_available "terraform" "terraform version"

echo ""
echo "🧪 tflint"
assert_available "tflint" "tflint --version"

echo ""
echo "💻 Python"
assert_available "python3" "python3 --version"

echo ""
echo "📋 jq"
assert_available "jq" "jq --version"

echo ""
echo "📄 yamllint"
assert_available "yamllint" "yamllint --version"

echo ""
echo "🗄️  SQLite"
assert_available "sqlite3" "sqlite3 --version"

echo ""
echo "🐳 Docker (DinD)"
if docker info > /dev/null 2>&1; then
  DOCKER_SERVER_VERSION=$(docker version --format '{{.Server.Version}}' 2>/dev/null || echo "unknown")
  pass "docker daemon reachable (server v${DOCKER_SERVER_VERSION})"
  COMPOSE_VERSION=$(docker compose version --short 2>/dev/null || echo "unknown")
  pass "docker compose available (v${COMPOSE_VERSION})"
else
  echo "  ⚠️  Docker daemon not reachable — skipping Docker tests (DinD only runs inside the devcontainer)"
fi

echo ""
echo "⚙️  VS Code Machine settings sync"
MACHINE_SETTINGS="/home/node/.vscode-server/data/Machine/settings.json"
if [ ! -f "${MACHINE_SETTINGS}" ]; then
  echo "  ⚠️  Machine settings file not found — skipping (only applies when VS Code is attached)"
elif [ ! -d "${WORKSPACE_ROOT}/node_modules" ]; then
  echo "  ⚠️  node_modules not installed — skipping (run pnpm install first)"
else
  SYNC_OUTPUT=$(cd "${WORKSPACE_ROOT}" && pnpm exec tsx .devcontainer/scripts/sync-vscode-settings.ts check 2>&1) || true
  if echo "${SYNC_OUTPUT}" | grep -q "✅"; then
    pass "VS Code Machine settings are in sync"
  else
    fail "VS Code Machine settings are out of sync — run: pnpm exec tsx .devcontainer/scripts/sync-vscode-settings.ts write"
  fi
fi

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo "────────────────────────────────────────"
TOTAL=$((PASS + FAIL))
echo "Results: ${PASS}/${TOTAL} passed"
echo ""

if [ "${FAIL}" -gt 0 ]; then
  echo "❌ ${FAIL} test(s) failed"
  exit 1
fi

echo "✅ All ${PASS} tests passed"
