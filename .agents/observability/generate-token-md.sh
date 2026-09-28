#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CSV="$SCRIPT_DIR/token-usage.csv"
MD="$SCRIPT_DIR/token-usage.md"

python3 - "$CSV" "$MD" <<'PYEOF'
import csv
import sys
from collections import defaultdict
from datetime import datetime

csv_path = sys.argv[1]
md_path = sys.argv[2]
now = datetime.now().strftime("%Y-%m-%d %H:%M")

rows = []
try:
    with open(csv_path, newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            rows.append({
                "date": row.get("date", ""),
                "session": (row.get("session_id", "") or "")[:8],
                "provider": row.get("provider", ""),
                "model": row.get("model", ""),
                "input": int(row.get("input_tokens") or 0),
                "output": int(row.get("output_tokens") or 0),
                "cache": int(row.get("cache_read") or 0),
                "total": int(row.get("total_tokens") or 0),
            })
except FileNotFoundError:
    rows = []

by_provider = defaultdict(lambda: {"input": 0, "output": 0, "cache": 0, "total": 0})
grand = {"input": 0, "output": 0, "cache": 0, "total": 0}
for row in rows:
    provider = row["provider"]
    by_provider[provider]["input"] += row["input"]
    by_provider[provider]["output"] += row["output"]
    by_provider[provider]["cache"] += row["cache"]
    by_provider[provider]["total"] += row["total"]
    grand["input"] += row["input"]
    grand["output"] += row["output"]
    grand["cache"] += row["cache"]
    grand["total"] += row["total"]

def fmt(value):
    return f"{value:,}"

lines = [
    "# Token Usage",
    "",
    f"> Last updated: {now}",
    "",
    "## Summary",
    "",
    "| Provider | Model | Input | Output | Cache Read | Total |",
    "|----------|-------|------:|-------:|-----------:|------:|",
]

if by_provider:
    for provider, stats in sorted(by_provider.items()):
      model_counts = defaultdict(int)
      for row in rows:
        if row["provider"] == provider:
          model_counts[row["model"]] += row["total"]
      top_model = max(model_counts, key=model_counts.get) if model_counts else "—"
      lines.append(f"| {provider} | {top_model} | {fmt(stats['input'])} | {fmt(stats['output'])} | {fmt(stats['cache'])} | **{fmt(stats['total'])}** |")
    lines.append(f"| **TOTAL** | | {fmt(grand['input'])} | {fmt(grand['output'])} | {fmt(grand['cache'])} | **{fmt(grand['total'])}** |")
else:
    lines.append("| — | — | — | — | — | — |")

lines.extend([
    "",
    "## Log",
    "",
    "| Date | Session | Provider | Model | Input | Output | Cache Read | Total |",
    "|------|---------|----------|-------|------:|-------:|-----------:|------:|",
])

if rows:
    for row in reversed(rows):
        lines.append(f"| {row['date']} | `{row['session']}` | {row['provider']} | {row['model']} | {fmt(row['input'])} | {fmt(row['output'])} | {fmt(row['cache'])} | {fmt(row['total'])} |")
else:
    lines.append("| — | — | — | — | — | — | — | — |")

with open(md_path, "w", encoding="utf-8") as fh:
    fh.write("\n".join(lines) + "\n")

print(f"✅ token-usage.md updated ({len(rows)} rows, {grand['total']:,} total tokens)")
PYEOF
