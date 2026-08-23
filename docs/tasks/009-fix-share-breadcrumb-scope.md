# 009 — Fix Share Breadcrumb Scope

- **Status:** done
- **Depends on:** none
- **GitHub issue:** #1 (critical bug)

## Goal

Public shared-folder pages must show breadcrumbs starting at the share root. Currently `getScopedBreadcrumb` walks ancestors up to the owner's account root and leaks private ancestor folder names to anonymous visitors.

## Checklist

- [x] Guard the ancestor-chain recursion at the share-root boundary
- [x] Breadcrumb of a nested shared folder starts with the share root
- [x] Regression tests: no out-of-scope ancestor names in breadcrumb
- [x] lint / typecheck / tests clean, live smoke check

## Acceptance Criteria

- [x] `/share/[token]?f=<nested>` shows breadcrumb `ShareRoot / ... / Current`
- [x] No folder names outside the shared subtree ever appear in responses

## Notes

Root cause: chain CTE has no boundary stop; rows ordered topmost-first include ancestors above the share root.
