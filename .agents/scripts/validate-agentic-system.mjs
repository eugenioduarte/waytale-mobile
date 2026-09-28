#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const failures = [];
const passes = [];

function resolve(relativePath) {
  return path.join(root, relativePath);
}

function pass(message) {
  passes.push(message);
}

function fail(message) {
  failures.push(message);
}

function requireFile(relativePath) {
  if (!fs.existsSync(resolve(relativePath))) {
    fail(`missing ${relativePath}`);
    return false;
  }
  return true;
}

function read(relativePath) {
  return fs.readFileSync(resolve(relativePath), 'utf8');
}

function parseJson(relativePath) {
  if (!requireFile(relativePath)) return undefined;
  try {
    return JSON.parse(read(relativePath));
  } catch {
    fail(`invalid JSON in ${relativePath}`);
    return undefined;
  }
}

function parseFrontmatter(content, relativePath) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) {
    fail(`missing YAML frontmatter in ${relativePath}`);
    return undefined;
  }

  const metadata = {};
  for (const line of match[1].split('\n')) {
    const separator = line.indexOf(':');
    if (separator < 1) {
      fail(`unsupported frontmatter line in ${relativePath}`);
      continue;
    }
    metadata[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  return metadata;
}

for (const required of [
  'AGENTS.md',
  'apps/mobile/AGENTS.md',
  'CLAUDE.md',
  '.agents/README.md',
  '.agents/evals/README.md',
  '.agents/evals/rubrics.json',
  '.agents/evals/skill-eval.schema.json',
  '.agents/evals/run-evals.mjs',
  '.agents/observability/run-event.schema.json',
  '.agents/observability/record-run.mjs',
]) {
  requireFile(required);
}

if (requireFile('CLAUDE.md') && read('CLAUDE.md').trim() !== '@AGENTS.md') {
  fail('CLAUDE.md must be the thin @AGENTS.md adapter');
} else {
  pass('portable instruction entry points');
}

const skillsRoot = resolve('.agents/skills');
const skills = fs
  .readdirSync(skillsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

for (const skill of skills) {
  const skillPath = `.agents/skills/${skill}/SKILL.md`;
  if (!requireFile(skillPath)) continue;
  const content = read(skillPath);
  const metadata = parseFrontmatter(content, skillPath);
  if (metadata) {
    const keys = Object.keys(metadata).sort();
    if (keys.join(',') !== 'description,name') {
      fail(`${skillPath} frontmatter must contain only name and description`);
    }
    if (metadata.name !== skill) fail(`${skillPath} name must match its directory`);
    if (!metadata.description) fail(`${skillPath} requires a discovery description`);
  }
  if (/\bTODO\b/i.test(content)) fail(`${skillPath} contains a TODO`);

  const openAiPath = `.agents/skills/${skill}/agents/openai.yaml`;
  if (!requireFile(openAiPath)) continue;
  const openAi = read(openAiPath);
  if (!openAi.includes('display_name:') || !openAi.includes('default_prompt:')) {
    fail(`${openAiPath} is missing interface metadata`);
  }
  if (!openAi.includes(`$${skill}`)) {
    fail(`${openAiPath} default prompt must reference $${skill}`);
  }
  requireFile(`.agents/skills/${skill}/evals/evals.json`);
}
pass(`${skills.length} retained skills have portable metadata`);

const roles = [
  'architect',
  'mobile-engineer',
  'reviewer',
  'runtime-verifier',
  'security-reviewer',
  'test-engineer',
  'validation-agent',
];

for (const role of roles) {
  requireFile(`.agents/roles/${role}.md`);
  requireFile(`.claude/agents/${role}.md`);
  requireFile(`.codex/agents/${role}.toml`);
}
pass(`${roles.length} canonical roles have Claude and Codex adapters`);

const claudeSkillsPath = resolve('.claude/skills');
if (!fs.existsSync(claudeSkillsPath) || !fs.lstatSync(claudeSkillsPath).isSymbolicLink()) {
  fail('.claude/skills must be a symlink to the canonical skill directory');
} else if (fs.readlinkSync(claudeSkillsPath) !== '../.agents/skills') {
  fail('.claude/skills points to the wrong target');
} else {
  pass('Claude reads the canonical skill directory');
}

const mcp = parseJson('.mcp.json');
if (mcp) {
  const servers = mcp.mcpServers ?? {};
  if (servers.claude_design?.url !== 'https://api.anthropic.com/v1/design/mcp') {
    fail('claude_design MCP endpoint is missing or incorrect');
  }
  if (servers.stitch?.headers?.['X-Goog-Api-Key'] !== '${STITCH_API_KEY}') {
    fail('Stitch MCP must use the STITCH_API_KEY environment reference');
  }
  pass('shared MCP configuration is secret-free');
}
parseJson('.claude/settings.json');
parseJson('.agents/settings.json');
parseJson('.agents/settings.local.example.json');

const inspectedTextFiles = [
  'AGENTS.md',
  'CLAUDE.md',
  '.mcp.json',
  '.claude/settings.json',
  '.codex/config.toml',
  '.agents/evals/rubrics.json',
  '.agents/evals/skill-eval.schema.json',
  '.agents/observability/run-event.schema.json',
  ...skills.flatMap((skill) => [
    `.agents/skills/${skill}/SKILL.md`,
    `.agents/skills/${skill}/agents/openai.yaml`,
    `.agents/skills/${skill}/evals/evals.json`,
  ]),
  ...roles.flatMap((role) => [
    `.agents/roles/${role}.md`,
    `.claude/agents/${role}.md`,
    `.codex/agents/${role}.toml`,
  ]),
];
const obviousSecretPatterns = [
  /AIza[0-9A-Za-z_-]{30,}/,
  /(?:sk|sk-proj)-[0-9A-Za-z_-]{20,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
];

for (const relativePath of inspectedTextFiles) {
  if (!fs.existsSync(resolve(relativePath))) continue;
  const content = read(relativePath);
  if (obviousSecretPatterns.some((pattern) => pattern.test(content))) {
    fail(`possible hardcoded secret in ${relativePath}`);
  }
  if (content.includes('.agents/sdd/')) {
    fail(`stale SDD path in ${relativePath}`);
  }
}

if (failures.length > 0) {
  console.error(`Agentic system validation failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Agentic system validation passed: ${passes.length} groups checked.`);
for (const message of passes) console.log(`- ${message}`);
