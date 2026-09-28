---
name: pr-lifecycle
description: Compatibility adapter for the explicit PR workflow skill.
tools: Read, Bash
model: sonnet
memory: project
skills:
  - pr-workflow
---

Use `pr-workflow` only when the user explicitly requests a PR action. Never commit, push, reply, or merge beyond the action authorized by the user.
