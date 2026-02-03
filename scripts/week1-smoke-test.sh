#!/usr/bin/env bash
#
# Week 1 Smoke Test – OpenClaw Marketplace
#
# Runs backend smoke test: intents, match propose/accept, transactions,
# disputes, and votes CRUD. Same flows are available via MCP tools
# (intent_create, match_propose, match_accept, etc.).
#
# Usage:
#   CONVEX_URL=https://your-deployment.convex.cloud ./scripts/week1-smoke-test.sh
#   Or set CONVEX_URL / NEXT_PUBLIC_CONVEX_URL in .env.local and run from project root.
#
# Expected output: each step logs "[smoke] OK: ..." and ends with
# "Week 1 smoke test finished. All steps passed." Exit 0 on success, 1 on failure.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load .env.local if present
if [[ -f "$PROJECT_DIR/.env.local" ]]; then
  set -a
  source "$PROJECT_DIR/.env.local"
  set +a
fi

export CONVEX_URL="${CONVEX_URL:-${NEXT_PUBLIC_CONVEX_URL:-}}"

if [[ -z "$CONVEX_URL" ]]; then
  echo "Error: CONVEX_URL or NEXT_PUBLIC_CONVEX_URL must be set."
  echo "Example: CONVEX_URL=https://your-deployment.convex.cloud $0"
  exit 1
fi

cd "$PROJECT_DIR"
echo "Running Week 1 smoke test (CONVEX_URL set)..."
exec npx tsx scripts/week1-smoke-test.ts
