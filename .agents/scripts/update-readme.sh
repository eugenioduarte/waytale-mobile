#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"

echo "Compatibility check: README updates are now review-only and never generated or staged automatically."
node "$ROOT_DIR/.agents/scripts/validate-agentic-system.mjs"
echo "If product behavior or setup changed, inspect README.md and update it explicitly when needed."
