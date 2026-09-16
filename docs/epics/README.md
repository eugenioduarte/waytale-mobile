# Epics

Each epic lives here as a markdown file (`EPIC-XX-slug.md`) before it becomes a
GitHub Issue. The file is the source of truth and gets reviewed like any other
change; the corresponding Issue (labeled `epic`, using the
[epic template](../../.github/ISSUE_TEMPLATE/epic.yml)) is what's tracked on
the Project board and linked to its child stories/tasks.

Workflow:

1. Add/edit `EPIC-XX-slug.md` here.
2. Create (or update) the matching GitHub Issue from it:
   `gh issue create --title "[EPIC] ..." --body-file docs/epics/EPIC-XX-slug.md --label epic`
3. Add the issue to the Project board.
