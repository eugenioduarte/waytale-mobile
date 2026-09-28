#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-src}"

if [ ! -d "$TARGET" ] && [ ! -f "$TARGET" ]; then
  echo "Target not found: $TARGET" >&2
  exit 1
fi

echo "Target: $TARGET"
echo "Source files: $(rg --files "$TARGET" -g '*.{ts,tsx}' | wc -l | tr -d ' ')"
echo
echo "Most imported modules (top 20):"
rg --glob '*.{ts,tsx}' --no-filename \
  "^[[:space:]]*import .* from ['\"]|^[[:space:]]*import ['\"]" "$TARGET" 2>/dev/null \
  | sed -E "s/.* from ['\"]([^'\"]+)['\"].*/\1/; s/^[[:space:]]*import ['\"]([^'\"]+)['\"].*/\1/" \
  | sort | uniq -c | sort -nr | head -20 || true

echo
echo "Direct screen/component imports from services:"
rg --glob '*.{screen,component}.tsx' \
  "from ['\"][^'\"]*(services?|api)/" "$TARGET" 2>/dev/null || echo "none found"
