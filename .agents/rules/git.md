---
paths:
  - ".gitignore"
  - ".github/**"
---

# Git Rules

- Never auto-commit or auto-push — humans commit, agents assist
- Never push directly to `main` or `master`
- Use Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`
- One logical change per PR — avoid mixing features with refactors
- PR descriptions must explain the *why*, not just the *what*
- CI must be green before merge — no exceptions
- Keep workflow changes auditable and intentional
