#!/usr/bin/env bash
# Shared paths and helpers for verify-willemstad. Source this file; do not execute it.

set -euo pipefail

_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(cd "${_LIB_DIR}/.." && pwd)"
REPO_ROOT="$(cd "${SKILL_DIR}/../../.." && pwd)"

# Walk up until manifest.json is at the repo root. theme.css is checked
# separately so a sparse checkout can print the recovery command.
_probe="${REPO_ROOT}"
for _ in 1 2 3 4; do
  if [[ -f "${_probe}/manifest.json" ]]; then
    REPO_ROOT="${_probe}"
    break
  fi
  _probe="$(cd "${_probe}/.." && pwd)"
done

if [[ ! -f "${REPO_ROOT}/manifest.json" ]]; then
  echo "error  manifest.json is not checked out" >&2
  echo "try: just deps" >&2
  exit 1
fi

VERIFY_BIND="${VERIFY_BIND:-127.0.0.1}"
VERIFY_PORT="${VERIFY_PORT:-47821}"
VERIFY_RUN_DIR="${VERIFY_RUN_DIR:-/tmp/verify-willemstad}"
VERIFY_EVIDENCE_DIR="${VERIFY_EVIDENCE_DIR:-/tmp/verify-willemstad/evidence}"

RUN_PID_FILE="${VERIFY_RUN_DIR}/server.pid"
RUN_META_FILE="${VERIFY_RUN_DIR}/meta.env"
RUN_LOG_FILE="${VERIFY_RUN_DIR}/server.log"

require_cmd() {
  local name="$1"
  if ! command -v "${name}" >/dev/null 2>&1; then
    echo "error  ${name} is not installed" >&2
    echo "try: just deps" >&2
    exit 2
  fi
}

require_theme_css() {
  if [[ ! -f "${REPO_ROOT}/theme.css" ]]; then
    echo "error  theme.css is not checked out" >&2
    echo "try: just deps" >&2
    exit 2
  fi
}

find_chrome() {
  local candidate
  for candidate in \
    "${VERIFY_CHROME:-}" \
    google-chrome-stable \
    google-chrome \
    chromium \
    chromium-browser \
    /usr/bin/google-chrome-stable \
    /usr/bin/google-chrome \
    /usr/local/bin/google-chrome
  do
    if [[ -n "${candidate}" ]] && command -v "${candidate}" >/dev/null 2>&1; then
      command -v "${candidate}"
      return 0
    fi
    if [[ -n "${candidate}" && -x "${candidate}" ]]; then
      printf '%s\n' "${candidate}"
      return 0
    fi
  done
  return 1
}

manifest_version() {
  python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["version"])' "${REPO_ROOT}/manifest.json"
}

theme_css_version() {
  python3 - "${REPO_ROOT}/theme.css" <<'PY'
import re, sys
text = open(sys.argv[1], encoding="utf-8", errors="replace").read(8000)
m = re.search(r"Willemstad \| v([0-9]+(?:\.[0-9]+)*)", text)
if not m:
    sys.exit("verify-willemstad: version banner missing from theme.css header")
print(m.group(1))
PY
}

base_url() {
  printf 'http://%s:%s' "${VERIFY_BIND}" "${VERIFY_PORT}"
}

load_run_meta() {
  if [[ ! -f "${RUN_META_FILE}" ]]; then
    echo "verify-willemstad: no run metadata at ${RUN_META_FILE} — launch first" >&2
    return 1
  fi
  # shellcheck disable=SC1090
  source "${RUN_META_FILE}"
}

pid_is_alive() {
  local pid="$1"
  [[ -n "${pid}" ]] && kill -0 "${pid}" 2>/dev/null
}

port_pid() {
  python3 - "${VERIFY_BIND}" "${VERIFY_PORT}" <<'PY'
import socket, sys
bind, port = sys.argv[1], int(sys.argv[2])
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.settimeout(0.4)
try:
    s.connect((bind, port))
except OSError:
    sys.exit(1)
finally:
    s.close()
print("open")
PY
}
