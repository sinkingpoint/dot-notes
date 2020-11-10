#!/bin/bash
set -meuo pipefail
IFS=$'\n\t'

function cleanup() {
  [[ -n "${FRONTEND_PID}" ]] && kill "${FRONTEND_PID}" 2>/dev/null || true
  [[ -n "${BACKEND_PID}" ]] && kill "${BACKEND_PID}" 2>/dev/null || true
  echo "--- DONE ---"
  exit 0
}

make bundle-dev dev

RUST_LOG="warp=debug" ./target/debug/dotnotes-backend -l localhost:3030 &
BACKEND_PID=$!
FRONTEND_PID=

stty -echoctl
trap cleanup INT
trap cleanup EXIT

xdg-open http://localhost:3030

inotifywait -m -e create,delete,modify -r ../frontend/webpack.config.js ../frontend/src ./src | while read dir ev file; do
  if echo "${dir}" | grep "frontend"; then
    ( [[ -n "${FRONTEND_PID}" ]] && (kill "${FRONTEND_PID}" 2>/dev/null || true) && make bundle-dev) &
    FRONTEND_PID=$!
  else
    ( (kill "${BACKEND_PID}" 2>/dev/null || true) && make dev && RUST_LOG="warp=debug" ./target/debug/dotnotes-backend -l localhost:3030) &
    BACKEND_PID=$!
  fi
done
