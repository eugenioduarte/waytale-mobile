import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const evalsRoot = path.dirname(fileURLToPath(import.meta.url))
export const repositoryRoot = path.resolve(evalsRoot, '../..')
export const skillsRoot = path.join(repositoryRoot, '.agents/skills')
export const defaultRunsRoot = path.join(repositoryRoot, '.agents_local/eval-runs')

const ID_PATTERN = /^[a-z0-9]+(?:_[a-z0-9]+)*$/
const SKILL_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const RUBRIC_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*-v[0-9]+$/
const ASSESSMENT_STATUSES = new Set(['pass', 'fail', 'not_applicable'])

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

export function loadRubrics(root = evalsRoot) {
  const catalog = readJson(path.join(root, 'rubrics.json'))
  const errors = []
  if (catalog.version !== 1) errors.push('rubrics.json version must be 1')
  if (!catalog.rubrics || typeof catalog.rubrics !== 'object' || Array.isArray(catalog.rubrics)) {
    errors.push('rubrics.json must contain a rubrics object')
    return { catalog, errors }
  }

  for (const [name, criteria] of Object.entries(catalog.rubrics)) {
    if (!RUBRIC_PATTERN.test(name)) errors.push(`rubric ${name} has an invalid versioned id`)
    if (!Array.isArray(criteria) || criteria.length < 2) {
      errors.push(`rubric ${name} must contain at least two criteria`)
      continue
    }
    const ids = new Set()
    let totalWeight = 0
    for (const criterion of criteria) {
      if (!criterion || typeof criterion !== 'object') {
        errors.push(`rubric ${name} contains an invalid criterion`)
        continue
      }
      if (!ID_PATTERN.test(criterion.id ?? ''))
        errors.push(`rubric ${name} has invalid criterion id`)
      if (ids.has(criterion.id)) errors.push(`rubric ${name} repeats criterion ${criterion.id}`)
      ids.add(criterion.id)
      if (typeof criterion.description !== 'string' || criterion.description.length < 10) {
        errors.push(`rubric ${name}/${criterion.id} needs a useful description`)
      }
      if (!Number.isInteger(criterion.weight) || criterion.weight <= 0) {
        errors.push(`rubric ${name}/${criterion.id} needs a positive integer weight`)
      } else {
        totalWeight += criterion.weight
      }
      if (typeof criterion.critical !== 'boolean') {
        errors.push(`rubric ${name}/${criterion.id} critical must be boolean`)
      }
    }
    if (totalWeight !== 100)
      errors.push(`rubric ${name} weights must total 100, found ${totalWeight}`)
  }
  return { catalog, errors }
}

export function validateSuite(suite, expectedSkill, rubricCatalog) {
  const errors = []
  if (!suite || typeof suite !== 'object' || Array.isArray(suite))
    return ['suite must be a JSON object']
  const allowedKeys = new Set(['$schema', 'version', 'skill', 'rubric', 'minimum_score', 'cases'])
  for (const key of Object.keys(suite)) {
    if (!allowedKeys.has(key)) errors.push(`${expectedSkill}: unsupported suite key ${key}`)
  }
  if (suite.version !== 1) errors.push(`${expectedSkill}: version must be 1`)
  if (!SKILL_PATTERN.test(suite.skill ?? '') || suite.skill !== expectedSkill) {
    errors.push(`${expectedSkill}: skill must match its directory`)
  }
  if (!RUBRIC_PATTERN.test(suite.rubric ?? '') || !rubricCatalog.rubrics[suite.rubric]) {
    errors.push(`${expectedSkill}: unknown or unversioned rubric ${suite.rubric ?? '<missing>'}`)
  }
  if (
    !Number.isInteger(suite.minimum_score) ||
    suite.minimum_score < 1 ||
    suite.minimum_score > 100
  ) {
    errors.push(`${expectedSkill}: minimum_score must be an integer from 1 to 100`)
  }
  if (!Array.isArray(suite.cases) || suite.cases.length === 0) {
    errors.push(`${expectedSkill}: cases must be a non-empty array`)
    return errors
  }

  const caseIds = new Set()
  for (const testCase of suite.cases) {
    const prefix = `${expectedSkill}/${testCase?.id ?? '<missing>'}`
    if (!testCase || typeof testCase !== 'object' || Array.isArray(testCase)) {
      errors.push(`${prefix}: case must be an object`)
      continue
    }
    const allowedCaseKeys = new Set(['id', 'prompt', 'expect', 'tags'])
    for (const key of Object.keys(testCase)) {
      if (!allowedCaseKeys.has(key)) errors.push(`${prefix}: unsupported case key ${key}`)
    }
    if (!ID_PATTERN.test(testCase.id ?? '')) errors.push(`${prefix}: invalid case id`)
    if (caseIds.has(testCase.id)) errors.push(`${prefix}: duplicate case id`)
    caseIds.add(testCase.id)
    if (typeof testCase.prompt !== 'string' || testCase.prompt.trim().length < 20) {
      errors.push(`${prefix}: prompt must contain at least 20 characters`)
    }
    if (
      !Array.isArray(testCase.expect) ||
      testCase.expect.length < 2 ||
      testCase.expect.some(item => typeof item !== 'string' || item.trim().length < 5)
    ) {
      errors.push(`${prefix}: expect must contain at least two useful outcomes`)
    }
    if (
      !Array.isArray(testCase.tags) ||
      testCase.tags.length === 0 ||
      testCase.tags.some(tag => !SKILL_PATTERN.test(tag))
    ) {
      errors.push(`${prefix}: tags must contain valid kebab-case values`)
    }
    if (JSON.stringify(testCase).includes('.claude'))
      errors.push(`${prefix}: contains a provider-specific repository path`)
  }
  return errors
}

export function discoverSuites(options = {}) {
  const root = options.skillsRoot ?? skillsRoot
  const rubricRoot = options.evalsRoot ?? evalsRoot
  const { catalog, errors } = loadRubrics(rubricRoot)
  const suites = []
  if (!fs.existsSync(root))
    return { suites, errors: [...errors, `missing skills directory ${root}`], catalog }

  const skills = fs
    .readdirSync(root, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort()
  for (const skill of skills) {
    const filePath = path.join(root, skill, 'evals/evals.json')
    if (!fs.existsSync(filePath)) {
      errors.push(`${skill}: missing evals/evals.json`)
      continue
    }
    try {
      const suite = readJson(filePath)
      errors.push(...validateSuite(suite, skill, catalog))
      suites.push({ ...suite, filePath })
    } catch (error) {
      errors.push(`${skill}: invalid eval JSON (${error.message})`)
    }
  }
  return { suites, errors, catalog }
}

export function findCase(suites, skill, caseId) {
  const suite = suites.find(candidate => candidate.skill === skill)
  if (!suite) throw new Error(`unknown skill: ${skill}`)
  const testCase = suite.cases.find(candidate => candidate.id === caseId)
  if (!testCase) throw new Error(`unknown case for ${skill}: ${caseId}`)
  return { suite, testCase }
}

export function buildRunBundle({ suite, testCase, rubric, provider, model, now = new Date() }) {
  if (!provider?.trim()) throw new Error('provider is required')
  if (!model?.trim()) throw new Error('model is required')
  const timestamp = now.toISOString().replace(/[:.]/g, '-')
  const runId = `${timestamp}_${provider}_${suite.skill}_${testCase.id}`.replace(
    /[^a-zA-Z0-9._-]/g,
    '-',
  )
  const result = {
    schema_version: 1,
    run_id: runId,
    suite_version: suite.version,
    rubric: suite.rubric,
    skill: suite.skill,
    case_id: testCase.id,
    provider,
    model,
    started_at: now.toISOString(),
    completed_at: null,
    duration_ms: null,
    retries: 0,
    token_usage: { input: 0, output: 0, cache_read: 0, total: 0 },
    response_path: 'response.md',
    evidence: [],
    assessments: rubric.map(criterion => ({
      criterion_id: criterion.id,
      status: 'pending',
      evidence: '',
    })),
    grade: null,
    notes: '',
  }
  const prompt = [
    `# Eval: ${suite.skill}/${testCase.id}`,
    '',
    'Complete the task using the repository instructions and only the context needed.',
    '',
    '## Task',
    '',
    testCase.prompt,
    '',
    'Return the outcome, focused evidence, checks performed, and residual risks.',
    '',
  ].join('\n')
  return { runId, result, prompt }
}

export function gradeResult(result, suite, rubric, now = new Date()) {
  const errors = []
  if (result.schema_version !== 1) errors.push('result schema_version must be 1')
  if (result.skill !== suite.skill) errors.push('result skill does not match suite')
  if (result.suite_version !== suite.version) errors.push('result suite_version is stale')
  if (result.rubric !== suite.rubric) errors.push('result rubric does not match suite')
  if (!suite.cases.some(testCase => testCase.id === result.case_id))
    errors.push('result case_id is unknown')
  if (!result.provider || !result.model) errors.push('result provider and model are required')
  if (!Number.isInteger(result.retries) || result.retries < 0)
    errors.push('result retries must be a non-negative integer')
  if (
    !result.token_usage ||
    ['input', 'output', 'cache_read', 'total'].some(
      key => !Number.isInteger(result.token_usage[key]) || result.token_usage[key] < 0,
    )
  ) {
    errors.push('result token_usage values must be non-negative integers')
  } else if (result.token_usage.total !== result.token_usage.input + result.token_usage.output) {
    errors.push(
      'result token_usage.total must equal input + output; cache_read is already part of input',
    )
  }
  if (
    result.duration_ms !== null &&
    (!Number.isInteger(result.duration_ms) || result.duration_ms < 0)
  )
    errors.push('result duration_ms must be null or a non-negative integer')
  if (!Array.isArray(result.assessments)) errors.push('result assessments must be an array')
  if (errors.length > 0) return { errors }

  const assessments = new Map(
    result.assessments.map(assessment => [assessment.criterion_id, assessment]),
  )
  let earned = 0
  let available = 0
  const criticalFailures = []
  for (const criterion of rubric) {
    const assessment = assessments.get(criterion.id)
    if (!assessment) {
      errors.push(`missing assessment for ${criterion.id}`)
      continue
    }
    if (!ASSESSMENT_STATUSES.has(assessment.status)) {
      errors.push(`${criterion.id} status must be pass, fail, or not_applicable`)
      continue
    }
    if (typeof assessment.evidence !== 'string' || assessment.evidence.trim().length < 3) {
      errors.push(`${criterion.id} requires concise evidence`)
    }
    if (assessment.status === 'not_applicable') {
      if (criterion.critical)
        errors.push(`${criterion.id} is critical and cannot be not_applicable`)
      continue
    }
    available += criterion.weight
    if (assessment.status === 'pass') earned += criterion.weight
    if (criterion.critical && assessment.status !== 'pass') criticalFailures.push(criterion.id)
  }
  if (result.assessments.length !== rubric.length)
    errors.push('result contains unknown or duplicate assessments')
  if (errors.length > 0) return { errors }

  const score = available === 0 ? 0 : Math.round((earned / available) * 10000) / 100
  const passed = score >= suite.minimum_score && criticalFailures.length === 0
  return {
    errors: [],
    result: {
      ...result,
      completed_at: result.completed_at ?? now.toISOString(),
      grade: {
        score,
        minimum_score: suite.minimum_score,
        passed,
        critical_failures: criticalFailures,
        graded_at: now.toISOString(),
      },
    },
  }
}

export function findResultFiles(root = defaultRunsRoot) {
  if (!fs.existsSync(root)) return []
  const files = []
  const visit = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name)
      if (entry.isDirectory()) visit(target)
      else if (entry.name === 'result.json') files.push(target)
    }
  }
  visit(root)
  return files.sort()
}

export function summarizeResults(results) {
  const graded = results.filter(result => result.grade && typeof result.grade.passed === 'boolean')
  const groups = new Map()
  for (const result of graded) {
    const key = `${result.provider}/${result.model}`
    const group = groups.get(key) ?? {
      provider: result.provider,
      model: result.model,
      runs: 0,
      passed: 0,
      score: 0,
      tokens: 0,
      duration_ms: 0,
      retries: 0,
    }
    group.runs += 1
    group.passed += result.grade.passed ? 1 : 0
    group.score += result.grade.score
    group.tokens += result.token_usage?.total ?? 0
    group.duration_ms += result.duration_ms ?? 0
    group.retries += result.retries ?? 0
    groups.set(key, group)
  }
  return [...groups.values()]
    .map(group => ({
      ...group,
      pass_rate: group.runs === 0 ? 0 : Math.round((group.passed / group.runs) * 10000) / 100,
      average_score: group.runs === 0 ? 0 : Math.round((group.score / group.runs) * 100) / 100,
      average_tokens: group.runs === 0 ? 0 : Math.round(group.tokens / group.runs),
      average_duration_ms: group.runs === 0 ? 0 : Math.round(group.duration_ms / group.runs),
    }))
    .sort(
      (a, b) =>
        b.pass_rate - a.pass_rate ||
        b.average_score - a.average_score ||
        a.average_tokens - b.average_tokens,
    )
}
