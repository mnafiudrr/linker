# 017 — Mobile Dashboard UI

- **Status:** done
- **Depends on:** none
- **GitHub issue:** #17

## Goal

Make all authenticated pages usable on mobile: hamburger drawer with the full sidebar content, responsive toolbars/headers, scrollable breadcrumbs. Desktop unchanged.

## Checklist

- [x] Drawer client component (slide-in from left, overlay, Esc/backdrop close)
- [x] Mobile top bar: hamburger + logo + bell + theme toggle
- [x] Folder page: truncating header, responsive toolbar, scrollable breadcrumb
- [x] Dashboard root page: same toolbar treatment
- [x] lint / typecheck / tests clean; smoke check at mobile viewport via dev service

## Acceptance Criteria

- [x] Folder navigation fully reachable on mobile through the drawer
- [x] No layout breakage at ~390px width

## Notes

Desktop rendering must remain identical — all changes gated behind `md:` breakpoints or scoped to the fixed mobile bar.
