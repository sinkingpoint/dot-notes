#!/bin/bash
set -meuo pipefail
IFS=$'\n\t'

function cleanup() {
  kill "${DOTNOTES_PID}"
  echo "--- DONE ---"
  exit 0
}

make dev

RUST_LOG="warp=debug" ./target/debug/dotnotes-backend -l localhost:3030 &
DOTNOTES_PID=$!

stty -echoctl
trap cleanup INT

xdg-open http://localhost:3030

inotifywait -m -e create,delete,modify -r ../frontend/src ./src | while read dir ev file; do
  if "${dir}" | grep "frontend"; then
    make bundle-dev
  else
    make dev
    kill "${DOTNOTES_PID}"
    RUST_LOG="warp=debug" ./target/debug/dotnotes-backend -l localhost:3030 &
    DOTNOTES_PID=$!
  fi
done
