# 004 — Link CRUD

- **Status:** done
- **Depends on:** [003]

## Goal

Implement link management inside folders: create (URL + title + description required at minimum), edit, move between folders, and delete — with ownership checks and http(s) URL validation.

## Checklist

- [ ] Server actions in `features/links/actions/`: `createLink`, `updateLink`, `moveLink`, `deleteLink` — Zod-validated + ownership-checked
- [ ] Zod schema: `url` must be valid http/https; `title` non-empty; description optional
- [ ] Queries: `getLinksInFolder(folderId)` ordered by created_at desc
- [ ] Move action validates destination folder ownership; delete confirms first
- [ ] Unit tests for validation schemas

## Acceptance Criteria

- [ ] User can CRUD links in any owned folder via actions (verified through app flow)
- [ ] Invalid URL / empty title rejected with field-level errors
- [ ] Moving a link to another owned folder re-parents it correctly

## Notes

Metadata auto-fill on create is task 005 — this task accepts manually entered data.
