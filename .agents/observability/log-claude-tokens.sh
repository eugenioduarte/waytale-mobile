#!/usr/bin/env bash

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
STATE_DIR="${AGENT_OBSERVABILITY_DIR:-$REPOSITORY_ROOT/.agents_local/.runtime/observability}"
STATE_FILE="$STATE_DIR/claude-token-state.json"
RECORDER="$SCRIPT_DIR/record-run.mjs"

INPUT="$(cat)"
SESSION_ID="$(printf '%s' "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('session_id','unknown'))" 2>/dev/null || printf 'unknown')"
TRANSCRIPT="$(printf '%s' "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('transcript_path',''))" 2>/dev/null || true)"

if [ -z "$TRANSCRIPT" ] || [ ! -f "$TRANSCRIPT" ]; then
  exit 0
fi

mkdir -p "$STATE_DIR"

EVENT="$(python3 - "$TRANSCRIPT" "$SESSION_ID" "$STATE_FILE" "${CLAUDE_AGENT_NAME:-unknown}" <<'PYEOF'
import json
import os
import sys
import tempfile

transcript_path, session_id, state_path, agent_name = sys.argv[1:]
totals = {"input": 0, "output": 0, "cache_read": 0}
model = "unknown"

with open(transcript_path, "r", encoding="utf-8") as transcript:
    for line in transcript:
        try:
            entry = json.loads(line)
        except Exception:
            continue
        message = entry.get("message", {})
        usage = message.get("usage", {})
        if message.get("role") != "assistant" or not usage:
            continue
        totals["input"] += int(usage.get("input_tokens", 0) or 0)
        totals["output"] += int(usage.get("output_tokens", 0) or 0)
        totals["cache_read"] += int(usage.get("cache_read_input_tokens", 0) or 0)
        model = message.get("model") or entry.get("model") or model

try:
    with open(state_path, "r", encoding="utf-8") as state_file:
        state = json.load(state_file)
except Exception:
    state = {}

previous = state.get(session_id, {"input": 0, "output": 0, "cache_read": 0})
deltas = {key: max(totals[key] - int(previous.get(key, 0)), 0) for key in totals}
if deltas["input"] + deltas["output"] == 0:
    raise SystemExit(0)

state[session_id] = totals
state_directory = os.path.dirname(state_path)
fd, temporary_path = tempfile.mkstemp(prefix="claude-token-state-", suffix=".json", dir=state_directory)
try:
    with os.fdopen(fd, "w", encoding="utf-8") as state_file:
        json.dump(state, state_file)
        state_file.write("\n")
    os.replace(temporary_path, state_path)
finally:
    if os.path.exists(temporary_path):
        os.unlink(temporary_path)

task_types = {
    "architect": "architecture",
    "mobile-engineer": "implementation",
    "reviewer": "review",
    "runtime-verifier": "runtime-verification",
    "security-reviewer": "security",
    "test-engineer": "tests",
    "validation-agent": "validation",
}
event = {
    "schema_version": 1,
    "event_id": f"claude-{session_id}-{totals['input']}-{totals['output']}",
    "run_id": session_id,
    "provider": "claude",
    "model": model,
    "agent": agent_name,
    "task_type": task_types.get(agent_name, "other"),
    "status": "stopped",
    "duration_ms": None,
    "retries": 0,
    "token_usage": {
        "input": deltas["input"],
        "output": deltas["output"],
        "cache_read": deltas["cache_read"],
        "total": deltas["input"] + deltas["output"],
    },
    "cost_usd": None,
    "eval": None,
}
print(json.dumps(event))
PYEOF
)"

if [ -n "$EVENT" ]; then
  printf '%s' "$EVENT" | AGENT_RUN_EVENTS_PATH="$STATE_DIR/run-events.jsonl" node "$RECORDER" >/dev/null
fi
