# Workflow Rules

> How tasks are created, tracked, and completed in this project. Applies to every session.

## 1. Task Files

- All tasks live in `./docs/tasks/`.
- **Naming convention:** `NNN-short-task-name.md`
  - `NNN` = zero-padded 3-digit sequence number (`000`, `001`, …)
  - name = lowercase kebab-case, short and descriptive
  - Examples: `001-database-schema-migrations.md`, `007-share-links-public-view.md`
- Numbers are never reused; new tasks take the next free number.

## 2. Task File Template

Every task file uses this structure:

```markdown
# NNN — Task Name

- **Status:** pending | in_progress | done | cancelled
- **Depends on:** [task numbers or "none"]

## Goal
One paragraph describing the outcome.

## Checklist
- [ ] Step
- [ ] Step

## Acceptance Criteria
- [ ] Verifiable condition

## Notes
Anything non-obvious (decisions, gotchas, links to diagrams).
```

## 3. Execution Rules

1. **Pull the next task** from `docs/tasks/` by lowest number with `Status: pending` whose dependencies are all `done`.
2. Set its status to `in_progress` before starting work; tick checklist items as you complete them.
3. Do not start a task before its dependencies are `done`.
4. A task is only `done` when **all** acceptance criteria are met and quality gates pass:
   - `npm run lint` — clean
   - `npm run typecheck` — clean
   - relevant tests pass
5. Update the task's `Status:` field immediately when state changes.
6. If a task is blocked, keep it `in_progress` and add a `## Notes` entry describing the blocker.
7. New discovered work → create a new task file with the next number, do not silently expand scope of an existing one.
8. Commit after each completed task: conventional commit style (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`).

## 4. Documentation Rules

- Requirements live in `docs/plans/prd.md`; technical design in `docs/plans/architecture.md`; visual/UX standards in `docs/plans/ui-design.md` (binding for all UI work).
- Every diagram is a `.puml` file in `docs/diagrams/` — no screenshots/ASCII art as source of truth.
- Code standards in `docs/rules/code-style.md` are binding for all code changes.
- Docs are updated **with** the task that makes them stale, not later.

## 5. Current Task Order

| # | Task |
|---|------|
| 000 | Project scaffolding |
| 001 | Database schema & migrations |
| 002 | Authentication |
| 003 | Folder CRUD |
| 004 | Link CRUD |
| 005 | URL metadata fetcher |
| 006 | Dashboard UI |
| 007 | Share links & public view |
| 008 | Polish & deploy |
