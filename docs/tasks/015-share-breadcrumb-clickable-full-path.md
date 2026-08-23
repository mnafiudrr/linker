# 015 — Shared Breadcrumb: Clickable, Full Tree Path

- **Status:** done
- **Depends on:** none
- **GitHub issue:** #13

## Goal

`/share/[token]` breadcrumbs show the complete chain (shared root → … → current folder) with every crumb rendered as a clickable link; the current folder is styled active.

## Checklist

- [x] `getScopedBreadcrumb` returns the inclusive chain (root → … → current)
- [x] Share page renders all crumbs as links; current styled active
- [x] Regression tests updated to the inclusive contract
- [x] lint / typecheck / tests clean, live smoke check

## Acceptance Criteria

- [x] Nested shared folder shows `Root / Parent / Current`, each crumb clickable
- [x] Scope boundary still enforced — no ancestors above the share root

## Notes

Supersedes the "exclude current folder" convention used by the dashboard breadcrumb.
