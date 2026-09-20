#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib.sh"

if [[ ! -f "${REPO_ROOT}/theme.css" ]]; then
  if git -C "${REPO_ROOT}" checkout HEAD -- theme.css 2>/dev/null && [[ -f "${REPO_ROOT}/theme.css" ]]; then
    echo "verify-willemstad: restored theme.css from this checkout"
  else
    echo "error  theme.css is not checked out" >&2
    echo "try: git checkout HEAD -- theme.css" >&2
    exit 2
  fi
fi

for command in python3 curl node; do
  if ! command -v "${command}" >/dev/null 2>&1; then
    echo "error  ${command} is not installed" >&2
    exit 2
  fi
done

if ! find_chrome >/dev/null 2>&1; then
  echo "error  Chromium is not installed" >&2
  echo "Install Chromium before running the browser drive." >&2
  exit 2
fi

echo "verify-willemstad: dependencies available"
