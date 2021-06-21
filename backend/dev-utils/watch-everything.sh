#!/bin/bash
set -meuo pipefail
IFS=$'\n\t'

function kill_all_background_jobs() {
  jobs=$(jobs -l | awk '{print $2}')
  [[ -n "${jobs}" ]] && echo "${jobs}" | xargs kill || true
  return 0
}

function cleanup() {
  kill_all_background_jobs
  echo "--- DONE ---"
  exit 0
}

make dev
make bundle-dev

RUST_LOG="warp=debug" ./target/debug/dotnotes-backend -l localhost:3030 &

stty -echoctl
trap cleanup INT
trap cleanup EXIT

xdg-open http://localhost:3030

inotifywait -m -e create,delete,modify -r ../frontend/webpack.config.js ../frontend/src ./src | while read dir ev file; do
  if echo "${dir}" | grep "frontend"; then
    kill_all_background_jobs
    make bundle-dev &
  else
    kill_all_background_jobs
    make dev && RUST_LOG="warp=debug" ./target/debug/dotnotes-backend -l localhost:3030 &
  fi
done
