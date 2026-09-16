#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-src}"
rg -n "if \\(|switch \\(|for \\(|while \\(" "$TARGET" || true
