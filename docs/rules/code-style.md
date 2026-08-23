# Code Style Rules

> Binding standards for all code in this repository. Enforced by lint/typecheck before any task is considered done.

## 1. TypeScript

- `strict: true` always. No `any` — use `unknown` + narrowing, or a precise type. If truly unavoidable, add a `// why:` comment.
- Prefer `type` for unions/aliases; `interface` for object contracts that may be extended.
- Export only what is consumed; avoid barrel files (`index.ts` re-exports) except for `components/ui`.
- No default exports (except Next.js route files and layouts, which require them).
- Validate external input at the boundary with Zod: server actions, API routes, env vars.

## 2. Naming Conventions

| Item | Style | Example |
|---|---|---|
| Files & folders | kebab-case | `link-card.tsx`, `metadata-fetcher.ts` |
| React components | PascalCase (named export) | `export function LinkCard()` |
| Variables / functions | camelCase, verb-first functions | `fetchMetadata()`, `resolveSubtree()` |
| Types / interfaces | PascalCase, no `I` prefix | `LinkWithFolder` |
| DB tables / columns | snake_case | `share_links`, `folder_id` |
| Env vars | SCREAMING_SNAKE_CASE | `DATABASE_URL` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_FOLDER_DEPTH = 10` |
| Booleans | `is/has/can/should` prefix | `isRevoked`, `hasChildren` |
| Async functions | no `Async` suffix; return `Promise` explicitly typed | `createShare(): Promise<Share>` |
| Event handlers | `handle<Event>` in components | `handleSubmit` |

## 3. Project Structure

- **Feature-based** under `src/features/<feature>/`: `components/`, `actions/`, `queries/`, `schema.ts`.
  - `actions/` = Server Actions (mutations). `queries/` = reads. Neither is imported by client components directly except via action calls from forms/handlers.
- Shared UI primitives → `src/components/ui/`; generic helpers → `src/lib/`.
- DB access lives in `src/db/` and feature `queries/` only. Mark `src/db/index.ts` with the `server-only` package so it can never reach client bundles.
- Route files stay thin: compose feature components; business logic belongs in features.

## 4. Functions & Modules

- One responsibility per function; small and pure where possible.
- Early returns over nested conditionals; guard clauses first.
- No magic numbers/strings — extract named constants.
- Max cyclomatic complexity ~10; if higher, split.
- Avoid premature abstraction: duplicate twice freely, abstract on the third occurrence (Rule of Three).
- No side effects at module import time.

## 5. Comments

- Code should be self-documenting. **No comments explaining "what"** — only rare `// why:` comments explaining non-obvious decisions (workarounds, security rationale, spec citations referencing docs/tasks).

## 6. React / Next.js

- **Server Components by default**; add `"use client"` only when the component needs state/effects/browser APIs.
- Mutations via Server Actions; do not create REST routes when an action suffices (the single exception: `/api/links/metadata` for mid-form JSON).
- Forms: progressive enhancement (`<form action={serverAction}`), Zod-validated inputs, `useActionState` for feedback.
- Never pass whole Drizzle rows to client components — map to explicit DTO types (no Date serialization surprises).
- Loading/error states are mandatory per route segment (`loading.tsx`, `error.tsx`) and per async action.

## 7. Error Handling

- Fail fast with typed errors: define domain error types per feature; don't throw raw strings.
- User-facing errors: friendly messages; log details server-side, never expose stack traces or SQL to clients.
- Never swallow errors silently; either handle meaningfully or rethrow with context.

## 8. Git & Commits

- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:` (+ optional scope, e.g. `feat(folders): move folder validation`).
- One logical change per commit; commit after each completed task (see workflow.md §3.8).
- Never commit secrets; `.env` is gitignored, `.env.example` documents keys.

## 9. Formatting

- Prettier defaults: 2-space indent, double quotes, trailing commas, semicolons; format on save / pre-commit hook.
- Imports sorted: builtin → external → internal aliases (`@/…`) → relative; auto-fixable.
- Line length soft limit 100 chars.
- ESLint must be clean — zero warnings tolerated on `main`.

## 10. Testing Expectations

- Unit tests for pure logic: metadata parsing, cycle detection, token/share validation.
- Integration tests for DB queries (subtree CTE, cascade deletes) against ephemeral Postgres.
- Tests live next to code as `*.test.ts`; run before marking any task done.
