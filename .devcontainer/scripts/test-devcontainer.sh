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
DEVCONTAINER_JSON="${WORKSPACE_ROOT}/.devcontainer/devcontainer.json"
PACKAGE_JSON="${WORKSPACE_ROOT}/package.json"

#region 📌 Expected pinned versions (single sources of truth: package.json & devcontainer.json)
NODE_MAJOR="$(jq -r '.features["ghcr.io/devcontainers/features/node:1"].version' "${DEVCONTAINER_JSON}")"
PNPM_VERSION="$(jq -r '.packageManager | split("@")[1]' "${PACKAGE_JSON}")"
EXPECTED_NX_VERSION="$(jq -r '.features["ghcr.io/devcontainers-extra/features/nx-npm:1"].version' "${DEVCONTAINER_JSON}")"
EXPECTED_GH_VERSION="$(jq -r '.features["ghcr.io/devcontainers/features/github-cli:1"].version' "${DEVCONTAINER_JSON}")"
EXPECTED_SUPABASE_VERSION="$(jq -r '.features["ghcr.io/devcontainers-extra/features/supabase-cli:1"].version' "${DEVCONTAINER_JSON}")"
EXPECTED_TERRAFORM_VERSION="$(jq -r '.features["ghcr.io/devcontainers/features/terraform:1"].version' "${DEVCONTAINER_JSON}")"
EXPECTED_TFLINT_VERSION="$(jq -r '.features["ghcr.io/devcontainers/features/terraform:1"].tflint' "${DEVCONTAINER_JSON}")"
EXPECTED_HELM_VERSION="$(jq -r '.features["ghcr.io/devcontainers/features/kubectl-helm-minikube:1"].helm' "${DEVCONTAINER_JSON}")"
EXPECTED_KUBECTL_VERSION="$(jq -r '.features["ghcr.io/devcontainers/features/kubectl-helm-minikube:1"].version' "${DEVCONTAINER_JSON}")"
EXPECTED_PYTHON_MAJOR_MINOR="$(jq -r '.features["ghcr.io/devcontainers/features/python:1"].version' "${DEVCONTAINER_JSON}")"
EXPECTED_YAMLLINT_VERSION="$(jq -r '.features["ghcr.io/devcontainers-extra/features/yamllint:2"].version' "${DEVCONTAINER_JSON}")"
EXPECTED_JQ_VERSION="$(jq -r '.features["ghcr.io/eitsupi/devcontainer-features/jq-likes:2"].jqVersion' "${DEVCONTAINER_JSON}")"
EXPECTED_SQLITE_VERSION="$(jq -r '.features["ghcr.io/warrenbuckley/codespace-features/sqlite:1"].version' "${DEVCONTAINER_JSON}")"
#endregion

#region 🛠️ Assertion helpers
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
# Checks that the output of <command> contains <expected_substring>.
assert_version_contains() {
  local label="$1"
  local expected="$2"
  local cmd="$3"
  local all_output
  all_output=$(eval "$cmd" 2>&1) || true
  if echo "$all_output" | grep -qF "$expected"; then
    local match_line
    match_line=$(echo "$all_output" | grep -F "$expected" | head -1 | xargs)
    pass "$label version matches ($match_line)"
  else
    local first_line
    first_line=$(echo "$all_output" | head -1)
    fail "$label version mismatch: expected '$expected', got '$first_line'"
  fi
}
#endregion

#region 🟢 Version-pinned tools
echo ""
echo "🟢 Node.js — must be v${NODE_MAJOR}.x (matches devcontainer.json node feature)"
assert_version_contains "node" "v${NODE_MAJOR}." "node --version"

echo ""
echo "📦 pnpm — must be ${PNPM_VERSION} (matches package.json packageManager)"
assert_version_contains "pnpm" "${PNPM_VERSION}" "pnpm --version"

echo ""
echo "🕋 Nx CLI — must be ${EXPECTED_NX_VERSION}"
assert_version_contains "nx" "${EXPECTED_NX_VERSION}" "nx --version"

echo ""
echo "🐙 GitHub CLI — must be ${EXPECTED_GH_VERSION}"
assert_version_contains "gh" "${EXPECTED_GH_VERSION}" "gh --version"

echo ""
echo "⚡ Supabase CLI — must be ${EXPECTED_SUPABASE_VERSION}"
assert_version_contains "supabase" "${EXPECTED_SUPABASE_VERSION}" "supabase --version"

echo ""
echo "🏗️  Terraform — must be ${EXPECTED_TERRAFORM_VERSION}"
assert_version_contains "terraform" "${EXPECTED_TERRAFORM_VERSION}" "terraform version"

echo ""
echo "🧪 tflint — must be ${EXPECTED_TFLINT_VERSION}"
assert_version_contains "tflint" "${EXPECTED_TFLINT_VERSION}" "tflint --version"

echo ""
echo "⛵ Helm — must be ${EXPECTED_HELM_VERSION}"
assert_version_contains "helm" "${EXPECTED_HELM_VERSION}" "helm version --short"

echo ""
echo "☸️  kubectl — must be v${EXPECTED_KUBECTL_VERSION}"
assert_version_contains "kubectl" "v${EXPECTED_KUBECTL_VERSION}" "kubectl version --client"

echo ""
echo "🐍 Python — must be ${EXPECTED_PYTHON_MAJOR_MINOR}.x"
assert_version_contains "python3" "Python ${EXPECTED_PYTHON_MAJOR_MINOR}." "python3 --version"

echo ""
echo "📋 jq — must be ${EXPECTED_JQ_VERSION}"
assert_version_contains "jq" "${EXPECTED_JQ_VERSION}" "jq --version"

echo ""
echo "📄 yamllint — must be ${EXPECTED_YAMLLINT_VERSION}"
assert_version_contains "yamllint" "${EXPECTED_YAMLLINT_VERSION}" "yamllint --version"

echo ""
echo "🗄️  SQLite — must be ${EXPECTED_SQLITE_VERSION}"
assert_version_contains "sqlite3" "${EXPECTED_SQLITE_VERSION}" "sqlite3 --version"
#endregion

#region 🐳 Docker (DinD)
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
#endregion

#region 🔒 Security
echo ""
echo "🔒 Container user (must be 'node', not root)"
CURRENT_USER="$(whoami)"
CURRENT_UID="$(id -u)"
if [ "${CURRENT_USER}" = "node" ]; then
  pass "running as user '${CURRENT_USER}' (uid=${CURRENT_UID})"
else
  fail "expected user 'node', got '${CURRENT_USER}' (uid=${CURRENT_UID})"
fi
#endregion

#region 🌍 Environment variables
echo ""
echo "🌍 Environment variables (remoteEnv)"
for ENV_VAR in KUBECONFIG NODE_OPTIONS UV_THREADPOOL_SIZE; do
  if [ -n "${!ENV_VAR+x}" ]; then
    pass "${ENV_VAR} is set (${!ENV_VAR})"
  else
    fail "${ENV_VAR} is not set"
  fi
done
#endregion

#region 🔧 Toolchain dependencies
echo ""
echo "🔧 Corepack (pnpm activation)"
assert_available "corepack" "corepack --version"

echo ""
echo "⚙️  tsx (lifecycle scripts)"
assert_available "tsx" "pnpm exec tsx --version"

echo ""
echo "📝 Git"
assert_available "git" "git --version"

echo ""
echo "📦 npm/npx"
assert_available "npm" "npm --version"
assert_available "npx" "npx --version"
#endregion

#region 📂 Post-create artifacts
echo ""
echo "📂 Post-create artifacts"
if [ -d "${WORKSPACE_ROOT}/node_modules" ]; then
  pass "node_modules/ exists"
else
  fail "node_modules/ not found (postCreateCommand may not have run)"
fi
if [ -f "${WORKSPACE_ROOT}/.nx/graph.json" ]; then
  pass ".nx/graph.json exists"
else
  fail ".nx/graph.json not found (nx graph may not have run)"
fi
#endregion

#region 🔑 Script permissions
echo ""
echo "🔑 Script permissions"
SCRIPTS_DIR="${WORKSPACE_ROOT}/.devcontainer/scripts"
for SCRIPT in "${SCRIPTS_DIR}"/*.sh; do
  SCRIPT_NAME="$(basename "${SCRIPT}")"
  if [ -x "${SCRIPT}" ]; then
    pass "${SCRIPT_NAME} is executable"
  else
    fail "${SCRIPT_NAME} is not executable"
  fi
done
#endregion

#region 🗂️ Workspace structure
echo ""
echo "🗂️  Workspace structure (mount sanity check)"
for DIR in applications packages infrastructure tools; do
  if [ -d "${WORKSPACE_ROOT}/${DIR}" ]; then
    pass "${DIR}/ exists"
  else
    fail "${DIR}/ not found (workspace mount may be incorrect)"
  fi
done
#endregion

#region 🧩 Extensions list consistency
echo ""
echo "🧩 VS Code extensions / recommendations sync"
if SYNC_OUTPUT=$(cd "${WORKSPACE_ROOT}" && pnpm exec tsx scripts/sync-vscode-extensions.ts check 2>&1); then
  pass "VS Code extensions are in sync"
else
  fail "VS Code extensions are out of sync — run: pnpm exec tsx scripts/sync-vscode-extensions.ts write"
fi
#endregion

#region ⚙️ VS Code Machine settings sync
echo ""
echo "⚙️  VS Code Machine settings sync"
if SYNC_OUTPUT=$(cd "${WORKSPACE_ROOT}" && pnpm exec tsx .devcontainer/scripts/sync-vscode-settings.ts check 2>&1); then
  pass "VS Code Machine settings are in sync"
else
  fail "VS Code Machine settings are out of sync — run: pnpm exec tsx .devcontainer/scripts/sync-vscode-settings.ts write"
fi
#endregion

#region 📊 Summary
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
#endregion
