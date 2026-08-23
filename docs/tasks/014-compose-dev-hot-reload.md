# 014 — Docker Compose `dev` Service with Hot Reload

- **Status:** done
- **Depends on:** none
- **GitHub issue:** #11

## Goal

A `dev` compose service running `next dev` with hot reload against the containerized Postgres, without changing the default production shape of `docker compose up -d`.

## Checklist

- [x] `dev` Dockerfile stage installs dependencies (npm ci) and enables file-watching polling
- [x] Compose service with source bind-mount + anonymous volumes for `node_modules` / `.next`
- [x] Gated behind the `dev` profile; default `up -d` untouched
- [x] Live verification: page serves, edit is picked up without container restart

## Acceptance Criteria

- [x] `docker compose --profile dev up -d dev` → :3000 responds, DB reachable
- [x] Source edit reflected on refresh (hot reload)

## Notes

Polling (`WATCHPACK_POLLING=true`) keeps inotify reliable across bind mounts.
