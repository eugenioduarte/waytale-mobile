#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const scriptRoot = path.dirname(fileURLToPath(import.meta.url))
const repositoryRoot = path.resolve(scriptRoot, '../..')
export const defaultEventsPath = process.env.AGENT_RUN_EVENTS_PATH
  ? path.resolve(process.env.AGENT_RUN_EVENTS_PATH)
  : path.join(repositoryRoot, '.agents_local/.runtime/observability/run-events.jsonl')
const statuses = new Set(['completed', 'failed', 'blocked', 'stopped'])

export function validateEvent(input) {
  const errors = []
  if (!input || typeof input !== 'object' || Array.isArray(input))
    return ['event must be a JSON object']
  if (input.schema_version !== 1) errors.push('schema_version must be 1')
  for (const field of ['run_id', 'provider', 'model', 'agent', 'task_type']) {
    if (typeof input[field] !== 'string' || input[field].trim().length === 0)
      errors.push(`${field} is required`)
  }
  if (!statuses.has(input.status)) errors.push('status is invalid')
  if (
    input.duration_ms !== null &&
    input.duration_ms !== undefined &&
    (!Number.isInteger(input.duration_ms) || input.duration_ms < 0)
  )
    errors.push('duration_ms must be null or a non-negative integer')
  if (!Number.isInteger(input.retries) || input.retries < 0)
    errors.push('retries must be a non-negative integer')
  const tokens = input.token_usage
  if (
    !tokens ||
    ['input', 'output', 'cache_read', 'total'].some(
      key => !Number.isInteger(tokens[key]) || tokens[key] < 0,
    )
  ) {
    errors.push('token_usage values must be non-negative integers')
  } else if (tokens.total !== tokens.input + tokens.output) {
    errors.push('token_usage.total must equal input + output; cache_read is already part of input')
  }
  if (
    input.cost_usd !== null &&
    input.cost_usd !== undefined &&
    (typeof input.cost_usd !== 'number' || input.cost_usd < 0)
  )
    errors.push('cost_usd must be null or non-negative')
  if (input.eval !== null && input.eval !== undefined) {
    if (
      typeof input.eval !== 'object' ||
      typeof input.eval.skill !== 'string' ||
      typeof input.eval.case_id !== 'string' ||
      typeof input.eval.passed !== 'boolean' ||
      typeof input.eval.score !== 'number' ||
      input.eval.score < 0 ||
      input.eval.score > 100
    ) {
      errors.push('eval must contain skill, case_id, score, and passed')
    }
  }
  return errors
}

export function normalizeEvent(input, now = new Date()) {
  return {
    schema_version: 1,
    event_id: input.event_id ?? randomUUID(),
    occurred_at: input.occurred_at ?? now.toISOString(),
    run_id: input.run_id,
    provider: input.provider,
    model: input.model,
    agent: input.agent,
    task_type: input.task_type,
    status: input.status,
    duration_ms: input.duration_ms ?? null,
    retries: input.retries,
    token_usage: input.token_usage,
    cost_usd: input.cost_usd ?? null,
    eval: input.eval ?? null,
  }
}

export function appendEvent(input, eventsPath = defaultEventsPath) {
  const errors = validateEvent(input)
  if (errors.length > 0) throw new Error(errors.join('\n'))
  const event = normalizeEvent(input)
  fs.mkdirSync(path.dirname(eventsPath), { recursive: true })
  if (fs.existsSync(eventsPath)) {
    const duplicate = fs
      .readFileSync(eventsPath, 'utf8')
      .split('\n')
      .filter(Boolean)
      .some(line => {
        try {
          return JSON.parse(line).event_id === event.event_id
        } catch {
          return false
        }
      })
    if (duplicate) throw new Error(`event_id already recorded: ${event.event_id}`)
  }
  fs.appendFileSync(eventsPath, `${JSON.stringify(event)}\n`, { encoding: 'utf8', mode: 0o600 })
  return event
}

async function readInput() {
  const fileIndex = process.argv.indexOf('--file')
  if (fileIndex >= 0) {
    const filePath = process.argv[fileIndex + 1]
    if (!filePath) throw new Error('--file requires a path')
    return fs.readFileSync(path.resolve(filePath), 'utf8')
  }
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  return Buffer.concat(chunks).toString('utf8')
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  readInput()
    .then(raw => appendEvent(JSON.parse(raw)))
    .then(event => console.log(`Recorded ${event.provider}/${event.model} run ${event.run_id}`))
    .catch(error => {
      console.error(error.message)
      process.exit(1)
    })
}
