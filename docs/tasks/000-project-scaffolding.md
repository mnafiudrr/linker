# 000 — Project Scaffolding

- **Status:** done
- **Depends on:** none

## Goal

Bootstrap the repository: Next.js 15 (App Router, TypeScript strict), ESLint/Prettier, Tailwind CSS v4, path aliases, Docker Compose dev environment with PostgreSQL 16, and the `docs/` documentation set committed.

## Checklist

- [x] Scaffold Next.js app (TypeScript, App Router, Tailwind, no src default → use `src/`)
- [x] Enable TS strict mode; configure path alias `@/*` → `src/*`
- [x] Add Prettier + import sorting + ESLint config; zero-warning baseline
- [x] Add scripts: `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `db:generate`, `db:migrate`
- [x] Create `docker-compose.yml`: `app` (dev) + `postgres` service with healthcheck & named volume
- [x] Create `.env.example` (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`); gitignore `.env`
- [x] Verify docs tree exists: `docs/plans/`, `docs/rules/`, `docs/diagrams/`, `docs/tasks/`

## Acceptance Criteria

- [x] `npm run dev` serves the default page at :3000 against the compose Postgres
- [x] `npm run lint && npm run typecheck` pass clean
- [x] `docker compose up -d` starts both services; Postgres healthy

## Notes

Diagrams in `docs/diagrams/*.puml` are part of this repo from day one. Deployment-grade Dockerfile lands in task 008.
