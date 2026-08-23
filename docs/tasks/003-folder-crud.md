# 003 — Folder CRUD

- **Status:** pending
- **Depends on:** [002]

## Goal

Implement folder management: create, rename, move, and delete folders as a per-user tree with depth limit 10, unique sibling names (case-insensitive), move-cycle prevention, and cascade delete of descendants.

## Checklist

- [ ] Server actions in `features/folders/actions/`: `createFolder`, `renameFolder`, `moveFolder`, `deleteFolder` — each Zod-validated + ownership-checked
- [ ] Enforce: max depth 10 (compute ancestor chain), sibling name uniqueness, reject moving a folder into its own descendant (use `resolveSubtreeIds`)
- [ ] Queries in `features/folders/queries/`: `getFolderContents`, `getBreadcrumb`, root listing
- [ ] Confirmation dialog before delete (cascade warning)
- [ ] Unit tests: cycle detection, depth validation; integration test: cascade delete

## Acceptance Criteria

- [ ] User can build a ≥ 3-level tree; all invalid operations return typed errors
- [ ] Deleting a mid-tree folder removes all descendants + contained links
- [ ] Moving `A` into `A/B` is rejected; moving into a sibling branch succeeds

## Notes

Tree semantics reference: `docs/diagrams/folder-tree-structure.puml`. UI comes in task 006 — this task is logic + actions only.
