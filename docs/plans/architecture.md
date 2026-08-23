# Architecture — Link

> Technical design for the Link web app. See `prd.md` for requirements and `../diagrams/` for visual diagrams.

## 1. Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 15 (App Router, TypeScript, strict) | Full-stack: UI + Server Actions + API routes |
| Database | PostgreSQL 16 | Runs in Docker Compose |
| ORM | Drizzle ORM + drizzle-kit migrations | Typed queries, recursive CTE support |
| Auth | Better Auth | Email/password, HTTP-only session cookies |
| Validation | Zod | On every mutation boundary |
| Styling | Tailwind CSS v4 | Utility-first; shadcn/ui optional for primitives |
| Runtime | Node.js 22 (alpine) | Single app container |
| Deployment | Docker Compose | `app` + `postgres` services |

## 2. Project Structure

```
link/
├── docs/                      # plans, rules, diagrams, tasks
├── src/
│   ├── app/
│   │   ├── (auth)/            # /sign-in, /sign-up
│   │   ├── (dashboard)/
│   │   │   └── dashboard/
│   │   │       ├── page.tsx           # root view
│   │   │       └── folder/[id]/page.tsx
│   │   ├── share/[token]/page.tsx     # public read-only view
│   │   ├── api/
│   │   │   └── links/metadata/route.ts # POST: fetch OG data
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── features/
│   │   ├── folders/
│   │   │   ├── components/
│   │   │   ├── actions/        # server actions (create/rename/move/delete)
│   │   │   ├── queries/        # read queries incl. recursive CTE
│   │   │   └── schema.ts
│   │   ├── links/
│   │   │   ├── components/
│   │   │   ├── actions/
│   │   │   ├── queries/
│   │   │   └── schema.ts
│   │   ├── share/
│   │   │   ├── actions/        # create/revoke share
│   │   │   └── queries/        # resolve shared subtree
│   │   └── auth/               # Better Auth setup & client helpers
│   ├── components/ui/          # shared primitives
│   ├── db/
│   │   ├── index.ts            # Drizzle client
│   │   └── migrations/
│   ├── lib/
│   │   ├── metadata-fetcher.ts # SSRF-guarded OG scraper
│   │   ├── env.ts              # Zod-validated env vars
│   │   └── utils.ts
│   └── server-only guard via `server-only` package in db/index.ts
├── docker-compose.yml
├── Dockerfile
└── .env.example
```

## 3. Data Model

```ts
// users — managed by Better Auth (text ids, per Better Auth defaults)
users(id text pk, name text, email text unique, email_verified bool,
      image text, created_at timestamptz, updated_at timestamptz)
sessions(id text pk, user_id fk→users, expires_at, ...)
accounts(id text pk, user_id fk→users, ...) // credential provider

folders(
  id         uuid pk default gen_random_uuid(),
  owner_id   text not null fk→users(id) on delete cascade,
  parent_id  uuid null fk→folders(id) on delete cascade, -- self-ref tree
  name       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)
-- index (owner_id), index (parent_id)
-- unique sibling name: unique index on (parent_id, lower(name))
-- depth ≤ 10 enforced in application logic

links(
  id                  uuid pk default gen_random_uuid(),
  folder_id           uuid not null fk→folders(id) on delete cascade,
  url                 text not null,      -- http(s) validated by Zod
  title               text not null,
  description         text,
  favicon_url         text,
  image_url           text,
  metadata_fetched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)
-- index (folder_id)

share_links(
  id         uuid pk default gen_random_uuid(),
  token      text not null unique,       -- nanoid(21), ≥128-bit entropy
  folder_id  uuid not null fk→folders(id) on delete cascade,
  created_by uuid not null fk→users(id),
  expires_at timestamptz null,
  revoked_at timestamptz null,
  created_at timestamptz not null default now()
)
```

### Subtree resolution (sharing + delete cascade)

Single recursive CTE:

```sql
WITH RECURSIVE subtree AS (
  SELECT id FROM folders WHERE id = $1
  UNION ALL
  SELECT f.id FROM folders f JOIN subtree s ON f.parent_id = s.id
)
SELECT ... ;
```

Used to: render shared trees (FR-13), prevent move-cycles (FR-04), and validate access.

## 4. Key Flows

- **URL metadata fetch** → see `../diagrams/url-metadata-flow.puml`
- **Share access** → see `../diagrams/share-link-flow.puml`
- **Auth** → see `../diagrams/auth-flow.puml`

## 5. API Surface

Prefer **Server Actions** for mutations. One API route exists because the client needs a JSON response mid-form:

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/links/metadata` | POST | `{url}` → SSRF-guarded fetch → `{title?, description?, favicon_url?, image_url?}` |

Server Actions (in feature `actions/`):

- folders: `createFolder`, `renameFolder`, `moveFolder`, `deleteFolder`
- links: `createLink`, `updateLink`, `moveLink`, `deleteLink`
- share: `createShare`, `revokeShare`

All mutations: Zod input validation + ownership check (`session.user.id === resource.owner_id`).

## 6. Security

| Concern | Control |
|---|---|
| SSRF | Scheme allowlist (http/https), DNS-resolve then reject private/reserved IP ranges (loopback, link-local 169.254/16 incl. cloud metadata, RFC1918, ULA), re-validate each redirect hop, 10 s timeout, 2 MB body cap |
| Share tokens | nanoid(21) (~126 bits); lookup by exact token; `revoked_at IS NULL AND (expires_at IS NULL OR expires_at > now())` |
| Ownership | Every mutation verifies `owner_id`; public reads only through share-token scope |
| Sessions | Better Auth defaults: HTTP-only, Secure, SameSite=Lax cookies |
| Injection | Drizzle parameterized queries only |

## 7. Deployment (Docker Compose)

Services:
- `app`: multi-stage build (deps → build → runner), Next.js standalone output, port 3000
- `postgres`: postgres:16-alpine, healthcheck, named volume `pgdata`
- Migrations applied automatically at container start (`drizzle-kit migrate` via entrypoint) before server start
- Config via `.env` (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NODE_ENV`)

Reverse proxy with TLS (Caddy/Traefik/nginx) is out of scope of the compose file but recommended.

See `deployment-architecture.puml`.

## 8. Testing Strategy

- Unit: metadata parser, cycle detection, token validation
- Integration: DB queries (subtree CTE, cascade deletes) against ephemeral Postgres
- E2E (post-MVP): Playwright happy paths

## 9. Diagram Index

| Diagram | File |
|---|---|
| System context | `../diagrams/system-context.puml` |
| ER diagram | `../diagrams/er-diagram.puml` |
| Folder tree structure | `../diagrams/folder-tree-structure.puml` |
| URL metadata flow | `../diagrams/url-metadata-flow.puml` |
| Share link flow | `../diagrams/share-link-flow.puml` |
| Auth flow | `../diagrams/auth-flow.puml` |
| API & actions map | `../diagrams/api-and-actions-map.puml` |
| Deployment architecture | `../diagrams/deployment-architecture.puml` |
