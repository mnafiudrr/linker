# 011 — Theme Toggle Light/Dark

- **Status:** done
- **Depends on:** [010]
- **GitHub issue:** #3

## Goal

Light/dark toggle on every page (landing, auth, dashboard, share). Class-based `.dark` strategy with `localStorage` persistence — not tied to user accounts. Default light. No FOUC.

## Checklist

- [x] Inline blocking script in root layout reads `localStorage.theme`, applies `.dark` before paint
- [x] `ThemeToggle` client component (sun/moon) writing localStorage + toggling class
- [x] Toggle placed: landing header, auth shell, dashboard sidebar, share banner row
- [x] Default is light when no stored preference
- [x] lint / typecheck / tests clean, smoke check both themes

## Acceptance Criteria

- [x] Toggle functional on all page types; choice survives reload
- [x] First visit renders light mode

## Notes

Suppress hydration mismatch: toggle icon rendered only after mount.
