# 007 — Share Links & Public View

- **Status:** done
- **Depends on:** [006]

## Goal

Implement folder sharing: owners generate/revoke share links; anonymous visitors browse the shared folder and its entire subtree read-only at `/share/[token]` with zero account and no exposure of data outside the shared scope.

## Checklist

- [ ] `features/share/actions/`: `createShare(folderId)` → nanoid(21) token; `revokeShare(shareId)` sets `revoked_at`
- [ ] Share dialog in dashboard UI: show URL, copy button, list active shares, revoke
- [ ] `/share/[token]/page.tsx`: validate token (`revoked_at IS NULL`, not expired) else 404-style page
- [ ] Resolve full subtree via recursive CTE; render same browsing components with mutations hidden + "read-only" banner
- [ ] Ensure no owner PII (email etc.) is ever rendered on public pages
- [ ] Integration tests: token validation, subtree scope, revoked/expired behavior

## Acceptance Criteria

- [ ] Incognito browser opens share URL and navigates all descendant folders/links read-only
- [ ] Revoked or expired token shows not-found page
- [ ] No route/mutation outside the shared subtree is reachable by a visitor

## Notes

Flow reference: `docs/diagrams/share-link-flow.puml`. Requirements: PRD FR-11…FR-15.
