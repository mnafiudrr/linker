# 008 — Polish & Deploy

- **Status:** done
- **Depends on:** [007]

## Goal

Harden and ship: production Dockerfile (multi-stage, standalone output), auto-migration entrypoint, error/edge polish across all routes, security review pass, and a verified one-command deployment.

## Checklist

- [ ] Multi-stage `Dockerfile` (deps → build → runner), Next.js standalone output, non-root user
- [ ] Entrypoint runs `drizzle-kit migrate` before server start; compose prod profile
- [ ] Global `not-found.tsx`, root `error.tsx`, invalid share token page polish
- [ ] Security review: SSRF guard coverage, ownership checks on every action, no secrets in client bundles
- [ ] Performance sanity: subtree CTE used everywhere (no N+1 folder traversal)
- [ ] README: setup (`docker compose up -d`), env vars, docs map
- [ ] Final QA against PRD §7 acceptance checklist

## Acceptance Criteria

- [ ] Fresh clone → `docker compose up -d` → working app with migrated DB
- [ ] All PRD §7 acceptance criteria checked
- [ ] lint + typecheck + tests clean; no console errors in normal flows

## Notes

Deployment reference: `docs/diagrams/deployment-architecture.puml`.
