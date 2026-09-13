#!/usr/bin/env bash
# Tear down the preview instance this run started. Evidence is left alone.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/lib.sh"

if [[ ! -f "${RUN_PID_FILE}" ]]; then
  echo "verify-willemstad: nothing to clean (${RUN_PID_FILE} absent)"
  echo "EVIDENCE_DIR=${VERIFY_EVIDENCE_DIR}"
  exit 0
fi

pid="$(cat "${RUN_PID_FILE}")"
if pid_is_alive "${pid}"; then
  kill "${pid}" 2>/dev/null || true
  for _ in $(seq 1 30); do
    pid_is_alive "${pid}" || break
    sleep 0.1
  done
  if pid_is_alive "${pid}"; then
    echo "verify-willemstad: pid ${pid} ignored SIGTERM, sending SIGKILL" >&2
    kill -9 "${pid}" 2>/dev/null || true
  fi
  echo "verify-willemstad: stopped pid ${pid}"
else
  echo "verify-willemstad: pid ${pid} already gone"
fi

rm -f "${RUN_PID_FILE}" "${RUN_META_FILE}"
# Keep the log until the next launch overwrites it; do not touch evidence.
echo "EVIDENCE_DIR=${VERIFY_EVIDENCE_DIR}"
