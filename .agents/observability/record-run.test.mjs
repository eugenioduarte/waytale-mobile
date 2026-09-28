import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { appendEvent, validateEvent } from './record-run.mjs'

const event = {
  schema_version: 1,
  event_id: 'test-event',
  run_id: 'test-run',
  provider: 'codex',
  model: 'test-model',
  agent: 'validation-agent',
  task_type: 'validation',
  status: 'completed',
  duration_ms: 100,
  retries: 0,
  token_usage: { input: 80, output: 20, cache_read: 10, total: 100 },
  cost_usd: null,
  eval: { skill: 'test-skill', case_id: 'test_case', score: 90, passed: true },
}

test('accepts a provider-neutral delta event', () => {
  assert.deepEqual(validateEvent(event), [])
})

test('rejects double-counted cache tokens', () => {
  const invalid = { ...event, token_usage: { ...event.token_usage, total: 110 } }
  assert.match(validateEvent(invalid).join('\n'), /input \+ output/)
})

test('records an event once', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-run-event-'))
  const target = path.join(directory, 'events.jsonl')
  appendEvent(event, target)
  assert.equal(JSON.parse(fs.readFileSync(target, 'utf8')).event_id, 'test-event')
  assert.throws(() => appendEvent(event, target), /already recorded/)
})

test('Claude Stop hook records transcript deltas only once', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-stop-hook-'))
  const transcript = path.join(directory, 'transcript.jsonl')
  fs.writeFileSync(
    transcript,
    [
      {
        message: {
          role: 'assistant',
          model: 'claude-test',
          usage: { input_tokens: 30, output_tokens: 10, cache_read_input_tokens: 5 },
        },
      },
      {
        message: {
          role: 'assistant',
          model: 'claude-test',
          usage: { input_tokens: 20, output_tokens: 5, cache_read_input_tokens: 3 },
        },
      },
    ]
      .map(entry => JSON.stringify(entry))
      .join('\n') + '\n',
  )
  const hookInput = JSON.stringify({ session_id: 'session-test', transcript_path: transcript })
  const script = path.join(path.dirname(fileURLToPath(import.meta.url)), 'log-claude-tokens.sh')
  const env = { ...process.env, AGENT_OBSERVABILITY_DIR: directory }

  const first = spawnSync('bash', [script], { input: hookInput, env, encoding: 'utf8' })
  const second = spawnSync('bash', [script], { input: hookInput, env, encoding: 'utf8' })
  assert.equal(first.status, 0, first.stderr)
  assert.equal(second.status, 0, second.stderr)

  const events = fs
    .readFileSync(path.join(directory, 'run-events.jsonl'), 'utf8')
    .trim()
    .split('\n')
    .map(line => JSON.parse(line))
  assert.equal(events.length, 1)
  assert.deepEqual(events[0].token_usage, {
    input: 50,
    output: 15,
    cache_read: 8,
    total: 65,
  })
  assert.equal(events[0].model, 'claude-test')
})
