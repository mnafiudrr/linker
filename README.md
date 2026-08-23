# Link

Self-hosted URL organizer: save links into nested folders (Google Drive–like), auto-fetch titles/descriptions/thumbnails from Open Graph meta tags, and share any folder publicly via a read-only link — no account needed for visitors.

## Stack

- Next.js 16 (App Router, TypeScript strict) · Tailwind CSS v4
- PostgreSQL 16 + Drizzle ORM
- Better Auth (email + password)
- Docker Compose deployment

## Quick start

```bash
cp .env.example .env
# set BETTER_AUTH_SECRET (openssl rand -base64 32)

docker compose up -d          # postgres → migrations → app
open http://localhost:3000    # sign up and start organizing
```

For development with hot reload:

```bash
docker compose --profile dev up -d dev   # postgres + next dev (hot reload)
open http://localhost:3000
```

Or run only the database on the host:

```bash
docker compose up -d postgres   # database only
npm install
npm run dev                     # http://localhost:3000
```

### Environment & ports

All ports and credentials come from `.env` (see `.env.example`):

| Variable | Default | Purpose |
|---|---|---|
| `APP_PORT` | `3000` | Host port for the app (`dev` and prod containers) |
| `POSTGRES_PORT` | `5432` | Host port for Postgres — bound to `127.0.0.1` only |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | `link` / `link` / `link` | Database credentials; the container-side `DATABASE_URL` is composed from these |
| `DATABASE_URL` | `postgres://link:link@localhost:5432/link` | Used by host-side tooling and tests |
| `BETTER_AUTH_URL` | `http://localhost:3000` | Auth base URL (update if you change `APP_PORT`) |
| `BETTER_AUTH_SECRET` | — (required for prod) | Session signing secret |

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `start` | Production build / serve |
| `npm run lint` / `typecheck` | Quality gates |
| `npm test` | Vitest suite (needs the compose Postgres running) |
| `npm run db:generate` | Generate Drizzle migration from schema |
| `npm run db:migrate` | Apply migrations |

## Documentation map

| Path | Contents |
|---|---|
| `docs/plans/prd.md` | Product requirements, user stories, acceptance criteria |
| `docs/plans/architecture.md` | Technical design, schema, security model |
| `docs/plans/ui-design.md` | Color system, typography, component specs |
| `docs/rules/` | Workflow rules + code style rules |
| `docs/diagrams/` | PlantUML diagrams (ERD, flows, deployment) |
| `docs/tasks/` | Numbered implementation tasks |

## Security notes

- Metadata fetching is SSRF-guarded: http(s) only, private/reserved IP ranges blocked, redirects re-validated, 10 s timeout, 2 MB cap.
- Share tokens are 21-char nanoids (~126-bit entropy); revocation is immediate.
- All mutations verify session ownership server-side.
