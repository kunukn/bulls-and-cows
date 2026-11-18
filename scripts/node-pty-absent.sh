#!/usr/bin/env bash
# Fails if `node-pty` is back in pnpm-lock.yaml. The pnpm override
# `node-pty: "-"` in pnpm-workspace.yaml keeps it out of the graph, which keeps
# code-inspector's unauthenticated terminal bridge off. Runs in CI without an
# install, so a lockfile refresh cannot bring it back unnoticed.

set -u

LOCKFILE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/pnpm-lock.yaml"

if hits="$(grep -nE "node-pty@[0-9]" "$LOCKFILE")"; then
  echo "FAIL: node-pty is back in pnpm-lock.yaml. Do not set allowBuilds node-pty: true; see pnpm-workspace.yaml."
  printf '%s\n' "$hits"
  exit 1
fi
echo "PASS: pnpm-lock.yaml has no node-pty"
