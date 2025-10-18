#!/bin/bash

# Add this to your shell script to kill processes running on a specified port
function killport() {
  port="$1"
  process_ids=$(lsof -t -i ":$port")
  if [ -z "$process_ids" ]; then
    echo "👍 No processes found running on port $port"
  else
    echo "⏹️ Killing processes running on port $port"
    echo "$process_ids" | while read -r process_id; do
      echo "⏹️ Killing process with PID $process_id"
      kill -9 "$process_id"
    done
    echo "✅ All processes running on port $port killed successfully."
  fi
}