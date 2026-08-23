# 006 — Dashboard UI

- **Status:** done
- **Depends on:** [003, 004, 005]

## Goal

Build the authenticated gdrive-like browsing experience: sidebar folder tree, breadcrumb navigation, folder contents as cards/list (folders + links with favicon/thumbnail), and all CRUD affordances wired to the server actions.

## Checklist

- [ ] Layout: responsive shell — sidebar tree, main content area
- [ ] `/dashboard` root view; `/dashboard/folder/[id]` scoped view sharing components
- [ ] Breadcrumbs from `getBreadcrumb`; navigate into folders by click
- [ ] Link cards: title, description snippet, favicon/OG image, open-in-new-tab
- [ ] Dialogs/forms: new folder, new link (with metadata auto-fill), rename, move, delete-with-confirm
- [ ] `loading.tsx` / `error.tsx` per segment; empty states (no folders, empty folder)
- [ ] Server Components by default; `"use client"` only for interactive parts

## Acceptance Criteria

- [ ] Full happy path: sign in → create nested folders → add links with auto-metadata → browse → edit → delete
- [ ] All mutations surface success/error feedback via action states
- [ ] Mobile layout usable; lint/typecheck clean

## Notes

UX overview: PRD §6.
