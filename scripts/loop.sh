#!/usr/bin/env bash
set -euo pipefail

# 🦜 Model
model="claude-haiku-4.5"

# 🛠️ Tools
enable_github_mcp=false
enable_mcp_json=false

# 💬 Prompt
prompt="Prompt here"

# 🗂 Inputs
paths=(
  "src/foo"
  "src/bar"
  "src/baz"
)

# 🔁 Loop
for path in "${paths[@]}"; do
  # 📎 Attachments
  attachments=()

  if [[ -f "${path}" ]]; then
    attachments+=("--attachment" "${path}")
  elif [[ -d "${path}" ]]; then
    while IFS= read -r -d '' file; do
      attachments+=("--attachment" "${file}")
    done < <(find "${path}" -type f -print0)
  else
    echo "warning: path does not exist or is not accessible: ${path}" >&2
    continue
  fi

  if [[ ${#attachments[@]} -eq 0 ]]; then
    echo "warning: no files found in ${path}" >&2
    continue
  fi

  # 🧠 Copilot
  copilot_arguments=(
    --model "${model}"
    --prompt "${prompt}"
    "${attachments[@]}"
    --allow-all-tools
    --allow-all-paths
    --no-ask-user
    --silent
    --stream off
  )

  if [[ "${enable_github_mcp}" == "true" ]]; then
    copilot_arguments+=(--add-github-mcp-toolset "all")
  fi

  if [[ "${enable_mcp_json}" == "true" ]]; then
    copilot_arguments+=(--additional-mcp-config "@.vscode/mcp.json")
  fi

  gh copilot -- "${copilot_arguments[@]}" &
done

wait
