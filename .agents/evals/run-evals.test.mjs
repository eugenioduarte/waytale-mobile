import assert from 'node:assert/strict'
import test from 'node:test'
import { buildRunBundle, gradeResult, summarizeResults, validateSuite } from './lib.mjs'

const rubric = [
  {
    id: 'correctness',
    description: 'Produces the required behavior and result.',
    weight: 70,
    critical: true,
  },
  {
    id: 'efficiency',
    description: 'Uses focused context and verification evidence.',
    weight: 30,
    critical: false,
  },
]
const catalog = { rubrics: { 'test-rubric-v1': rubric } }
const suite = {
  version: 1,
  skill: 'test-skill',
  rubric: 'test-rubric-v1',
  minimum_score: 80,
  cases: [
    {
      id: 'bounded_case',
      prompt: 'Review this bounded behavior and return evidence.',
      expect: ['Finds the relevant issue', 'Returns verification evidence'],
      tags: ['smoke'],
    },
  ],
}

test('validates a canonical skill suite', () => {
  assert.deepEqual(validateSuite(suite, 'test-skill', catalog), [])
})

test('rejects a missing skill eval contract', () => {
  const invalid = { ...suite, cases: [] }
  assert.match(validateSuite(invalid, 'test-skill', catalog).join('\n'), /non-empty array/)
})

test('grades critical failures as failed', () => {
  const { result } = buildRunBundle({
    suite,
    testCase: suite.cases[0],
    rubric,
    provider: 'codex',
    model: 'test-model',
    now: new Date('2026-01-01T00:00:00.000Z'),
  })
  result.assessments = [
    { criterion_id: 'correctness', status: 'fail', evidence: 'Required behavior was absent.' },
    { criterion_id: 'efficiency', status: 'pass', evidence: 'The response was focused.' },
  ]
  const graded = gradeResult(result, suite, rubric, new Date('2026-01-01T00:01:00.000Z'))
  assert.equal(graded.errors.length, 0)
  assert.equal(graded.result.grade.passed, false)
  assert.deepEqual(graded.result.grade.critical_failures, ['correctness'])
})

test('keeps evaluator expectations out of the producer prompt', () => {
  const bundle = buildRunBundle({
    suite,
    testCase: suite.cases[0],
    rubric,
    provider: 'codex',
    model: 'test-model',
  })
  assert.doesNotMatch(bundle.prompt, /Finds the relevant issue/)
  assert.match(bundle.prompt, /Review this bounded behavior/)
})

test('rejects token totals that count cache twice', () => {
  const { result } = buildRunBundle({
    suite,
    testCase: suite.cases[0],
    rubric,
    provider: 'codex',
    model: 'test-model',
  })
  result.token_usage = { input: 80, output: 20, cache_read: 10, total: 110 }
  result.assessments = [
    { criterion_id: 'correctness', status: 'pass', evidence: 'All expectations passed.' },
    { criterion_id: 'efficiency', status: 'pass', evidence: 'Context stayed focused.' },
  ]
  assert.match(gradeResult(result, suite, rubric).errors.join('\n'), /input \+ output/)
})

test('normalizes non-critical not-applicable criteria', () => {
  const { result } = buildRunBundle({
    suite,
    testCase: suite.cases[0],
    rubric,
    provider: 'claude',
    model: 'test-model',
    now: new Date('2026-01-01T00:00:00.000Z'),
  })
  result.assessments = [
    { criterion_id: 'correctness', status: 'pass', evidence: 'All expectations were satisfied.' },
    {
      criterion_id: 'efficiency',
      status: 'not_applicable',
      evidence: 'No tool or context usage was required.',
    },
  ]
  const graded = gradeResult(result, suite, rubric)
  assert.equal(graded.result.grade.score, 100)
  assert.equal(graded.result.grade.passed, true)
})

test('summarizes providers with quality before token economy', () => {
  const results = [
    {
      provider: 'claude',
      model: 'a',
      retries: 1,
      duration_ms: 100,
      token_usage: { total: 1000 },
      grade: { passed: true, score: 90 },
    },
    {
      provider: 'codex',
      model: 'b',
      retries: 0,
      duration_ms: 80,
      token_usage: { total: 700 },
      grade: { passed: true, score: 90 },
    },
  ]
  const summary = summarizeResults(results)
  assert.equal(summary[0].provider, 'codex')
  assert.equal(summary[0].average_tokens, 700)
})
