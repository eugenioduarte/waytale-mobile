#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import {
  buildRunBundle,
  defaultRunsRoot,
  discoverSuites,
  findCase,
  findResultFiles,
  gradeResult,
  readJson,
  summarizeResults,
} from './lib.mjs'
import { appendEvent } from '../observability/record-run.mjs'

function parseArgs(values) {
  const options = { _: [] }
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index]
    if (!value.startsWith('--')) {
      options._.push(value)
      continue
    }
    const key = value.slice(2)
    const next = values[index + 1]
    if (!next || next.startsWith('--')) options[key] = true
    else {
      options[key] = next
      index += 1
    }
  }
  return options
}

function loadValidSystem() {
  const discovered = discoverSuites()
  if (discovered.errors.length > 0) {
    console.error(`Eval validation failed (${discovered.errors.length}):`)
    for (const error of discovered.errors) console.error(`- ${error}`)
    process.exit(1)
  }
  return discovered
}

function requireOption(options, name) {
  if (!options[name] || options[name] === true) throw new Error(`--${name} is required`)
  return options[name]
}

function printHelp() {
  console.log(`Usage: node .agents/evals/run-evals.mjs <command> [options]

Commands:
  validate
  list [--skill NAME] [--tag TAG]
  prepare --skill NAME --case ID --provider NAME --model ID [--out DIRECTORY]
  grade --result FILE [--record]
  report [--runs DIRECTORY] [--json]
`)
}

async function main() {
  const [command = 'help', ...rawOptions] = process.argv.slice(2)
  const options = parseArgs(rawOptions)

  if (command === 'help' || command === '--help') {
    printHelp()
    return
  }

  const { suites, catalog } = loadValidSystem()
  if (command === 'validate') {
    const caseCount = suites.reduce((total, suite) => total + suite.cases.length, 0)
    console.log(
      `Eval validation passed: ${suites.length} skill suites, ${caseCount} cases, ${Object.keys(catalog.rubrics).length} rubrics.`,
    )
    return
  }

  if (command === 'list') {
    const selected = suites.filter(suite => !options.skill || suite.skill === options.skill)
    if (options.skill && selected.length === 0) throw new Error(`unknown skill: ${options.skill}`)
    for (const suite of selected) {
      for (const testCase of suite.cases) {
        if (options.tag && !testCase.tags.includes(options.tag)) continue
        console.log(`${suite.skill}/${testCase.id}\t${suite.rubric}\t${testCase.tags.join(',')}`)
      }
    }
    return
  }

  if (command === 'prepare') {
    const skill = requireOption(options, 'skill')
    const caseId = requireOption(options, 'case')
    const provider = requireOption(options, 'provider')
    const model = requireOption(options, 'model')
    const { suite, testCase } = findCase(suites, skill, caseId)
    const rubric = catalog.rubrics[suite.rubric]
    const bundle = buildRunBundle({ suite, testCase, rubric, provider, model })
    const outputDirectory = path.resolve(
      options.out && options.out !== true ? options.out : path.join(defaultRunsRoot, bundle.runId),
    )
    if (fs.existsSync(outputDirectory)) throw new Error(`output already exists: ${outputDirectory}`)
    fs.mkdirSync(outputDirectory, { recursive: true })
    fs.writeFileSync(path.join(outputDirectory, 'prompt.md'), bundle.prompt)
    fs.writeFileSync(path.join(outputDirectory, 'response.md'), '# Response\n\n')
    fs.writeFileSync(
      path.join(outputDirectory, 'result.json'),
      `${JSON.stringify(bundle.result, null, 2)}\n`,
    )
    console.log(`Prepared ${suite.skill}/${testCase.id}: ${outputDirectory}`)
    return
  }

  if (command === 'grade') {
    const resultPath = path.resolve(requireOption(options, 'result'))
    const result = readJson(resultPath)
    const suite = suites.find(candidate => candidate.skill === result.skill)
    if (!suite) throw new Error(`result references unknown skill: ${result.skill}`)
    const graded = gradeResult(result, suite, catalog.rubrics[suite.rubric])
    if (graded.errors.length > 0) throw new Error(graded.errors.join('\n'))
    fs.writeFileSync(resultPath, `${JSON.stringify(graded.result, null, 2)}\n`)
    if (options.record) {
      appendEvent({
        schema_version: 1,
        event_id: `eval-${graded.result.run_id}`,
        run_id: graded.result.run_id,
        provider: graded.result.provider,
        model: graded.result.model,
        agent: 'eval-producer',
        task_type: 'evaluation',
        status: 'completed',
        duration_ms: graded.result.duration_ms,
        retries: graded.result.retries,
        token_usage: graded.result.token_usage,
        cost_usd: null,
        eval: {
          skill: graded.result.skill,
          case_id: graded.result.case_id,
          score: graded.result.grade.score,
          passed: graded.result.grade.passed,
        },
      })
    }
    console.log(
      `${graded.result.grade.passed ? 'PASS' : 'FAIL'} ${result.skill}/${result.case_id}: ${graded.result.grade.score}/${graded.result.grade.minimum_score}`,
    )
    if (!graded.result.grade.passed) process.exitCode = 2
    return
  }

  if (command === 'report') {
    const runsRoot = path.resolve(
      options.runs && options.runs !== true ? options.runs : defaultRunsRoot,
    )
    const results = []
    const invalid = []
    for (const filePath of findResultFiles(runsRoot)) {
      try {
        results.push(readJson(filePath))
      } catch (error) {
        invalid.push(`${filePath}: ${error.message}`)
      }
    }
    if (invalid.length > 0) throw new Error(invalid.join('\n'))
    const summary = summarizeResults(results)
    if (options.json) {
      console.log(
        JSON.stringify(
          {
            runs_root: runsRoot,
            discovered: results.length,
            graded: results.filter(result => result.grade).length,
            providers: summary,
          },
          null,
          2,
        ),
      )
      return
    }
    console.log(
      `Eval report: ${results.length} runs discovered, ${results.filter(result => result.grade).length} graded.`,
    )
    if (summary.length === 0) {
      console.log('No graded runs yet.')
      return
    }
    console.log('Provider/model\tRuns\tPass rate\tAvg score\tAvg tokens\tAvg duration\tRetries')
    for (const group of summary) {
      console.log(
        `${group.provider}/${group.model}\t${group.runs}\t${group.pass_rate}%\t${group.average_score}\t${group.average_tokens}\t${group.average_duration_ms}ms\t${group.retries}`,
      )
    }
    return
  }

  throw new Error(`unknown command: ${command}`)
}

main().catch(error => {
  console.error(error.message)
  process.exit(1)
})
