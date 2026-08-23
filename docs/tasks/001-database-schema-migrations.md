# 001 — Database Schema & Migrations

- **Status:** pending
- **Depends on:** [000]

## Goal

Set up Drizzle ORM with PostgreSQL and define the full schema: Better Auth tables (`users`, `sessions`, `accounts`), `folders` (self-referencing tree), `links`, `share_links`, including indexes, FKs with cascade deletes, and the unique-sibling-name constraint.

## Checklist

- [ ] Install drizzle-orm, drizzle-kit, postgres driver; create `src/db/index.ts` guarded by `server-only`
- [ ] Zod-validate env in `src/lib/env.ts`
- [ ] Define schema per `docs/plans/architecture.md` §3 (tables in feature `schema.ts` files or `src/db/schema/`)
- [ ] Indexes: `folders(owner_id)`, `folders(parent_id)`, unique `(parent_id, lower(name))`; `links(folder_id)`; `share_links(token)` unique
- [ ] Implement recursive CTE helper query: `resolveSubtreeIds(folderId)`
- [ ] Add migration scripts; run first migration against compose Postgres

## Acceptance Criteria

- [ ] `npm run db:migrate` creates all tables with constraints verified via `\d`
- [ ] Recursive CTE returns correct descendant set on a seeded 3-level tree
- [ ] Cascade delete removes child folders + links (integration test)

## Notes

Keep depth ≤ 10 validation for task 003 (app logic), not DB constraint.
