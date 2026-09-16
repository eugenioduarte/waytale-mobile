#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { defaultEventsPath } from './record-run.mjs'

const fileIndex = process.argv.indexOf('--file')
const eventsPath = path.resolve(fileIndex >= 0 ? process.argv[fileIndex + 1] : defaultEventsPath)

if (!fs.existsSync(eventsPath)) {
  console.log(`No run events found at ${eventsPath}`)
  process.exit(0)
}

const events = fs
  .readFileSync(eventsPath, 'utf8')
  .split('\n')
  .filter(Boolean)
  .map((line, index) => {
    try {
      return JSON.parse(line)
    } catch (error) {
      throw new Error(`invalid JSONL at line ${index + 1}: ${error.message}`)
    }
  })

const groups = new Map()
for (const event of events) {
  const key = `${event.provider}/${event.model}`
  const group = groups.get(key) ?? {
    runs: 0,
    tokens: 0,
    cache: 0,
    duration: 0,
    durationRuns: 0,
    retries: 0,
    evaluated: 0,
    passed: 0,
    cost: 0,
    costRuns: 0,
  }
  group.runs += 1
  group.tokens += event.token_usage?.total ?? 0
  group.cache += event.token_usage?.cache_read ?? 0
  group.retries += event.retries ?? 0
  if (Number.isInteger(event.duration_ms)) {
    group.duration += event.duration_ms
    group.durationRuns += 1
  }
  if (event.eval) {
    group.evaluated += 1
    group.passed += event.eval.passed ? 1 : 0
  }
  if (typeof event.cost_usd === 'number') {
    group.cost += event.cost_usd
    group.costRuns += 1
  }
  groups.set(key, group)
}

console.log(`Agent run report: ${events.length} delta events from ${eventsPath}`)
console.log('Provider/model\tRuns\tTokens\tCache\tAvg duration\tRetries\tEval pass\tReported cost')
for (const [key, group] of [...groups.entries()].sort()) {
  const duration = group.durationRuns
    ? `${Math.round(group.duration / group.durationRuns)}ms`
    : 'n/a'
  const evalPass = group.evaluated
    ? `${Math.round((group.passed / group.evaluated) * 10000) / 100}%`
    : 'n/a'
  const cost = group.costRuns ? `$${group.cost.toFixed(4)}` : 'n/a'
  console.log(
    `${key}\t${group.runs}\t${group.tokens}\t${group.cache}\t${duration}\t${group.retries}\t${evalPass}\t${cost}`,
  )
}
