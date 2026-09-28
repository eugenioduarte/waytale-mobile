#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CSV="$SCRIPT_DIR/token-usage.csv"

if [ ! -f "$CSV" ]; then
  echo "⚠️  No token usage data found"
  exit 0
fi

TODAY="$(date +"%Y-%m-%d")"

python3 - "$CSV" "$TODAY" <<'PYEOF'
import csv
import sys
from collections import defaultdict

csv_path = sys.argv[1]
today = sys.argv[2]

totals = defaultdict(lambda: {"input": 0, "output": 0, "cache": 0, "total": 0})
overall = {"input": 0, "output": 0, "cache": 0, "total": 0}

with open(csv_path, newline="", encoding="utf-8") as fh:
    for row in csv.DictReader(fh):
        date_str = (row.get("date") or "")[:10]
        if date_str != today:
            continue
        provider = row.get("provider") or "unknown"
        inp = int(row.get("input_tokens") or 0)
        out = int(row.get("output_tokens") or 0)
        cache = int(row.get("cache_read") or 0)
        total = int(row.get("total_tokens") or 0)
        totals[provider]["input"] += inp
        totals[provider]["output"] += out
        totals[provider]["cache"] += cache
        totals[provider]["total"] += total
        overall["input"] += inp
        overall["output"] += out
        overall["cache"] += cache
        overall["total"] += total

if overall["total"] == 0:
    print(f"ℹ️  No tokens used today ({today})")
    raise SystemExit(0)

print(f"\n📊 Token Usage for {today}")
print("=" * 60)
for provider in sorted(totals):
    stats = totals[provider]
    print(f"\n{provider.upper()}:")
    print(f"  Input:      {stats['input']:,} tokens")
    print(f"  Output:     {stats['output']:,} tokens")
    if stats["cache"] > 0:
        print(f"  Cache Read: {stats['cache']:,} tokens")
    print(f"  Total:      {stats['total']:,} tokens")
print(f"\n{'─' * 60}")
print(f"OVERALL TOTAL: {overall['total']:,} tokens")
print(f"  • Input:  {overall['input']:,}")
print(f"  • Output: {overall['output']:,}")
if overall["cache"] > 0:
    print(f"  • Cache:  {overall['cache']:,}")
print("=" * 60 + "\n")
PYEOF

exit 0
