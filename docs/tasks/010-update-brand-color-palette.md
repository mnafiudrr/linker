# 010 — Update Brand Color Palette

- **Status:** done
- **Depends on:** none
- **GitHub issue:** #2

## Goal

Replace the baby-blue brand palette with the four requested anchors — Sky Blue `#67AEEE`, Soft Lilac `#FBD3FF`, Soft Peach `#FFDBD0`, Light Baby Blue `#D4EEFF` — rebuilding both light and dark theme ramps while keeping WCAG AA contrast.

## Checklist

- [x] New light-theme token ramps in `globals.css` (primary anchored on #67AEEE, lilac/peach accents, baby-blue surfaces)
- [x] Matching dark-theme ramps (AA contrast verified)
- [x] Update `docs/plans/ui-design.md §2` color tables
- [x] lint / typecheck / tests clean, visual smoke check

## Acceptance Criteria

- [x] All four anchors present and used in both themes
- [x] No leftover old palette hex values in tokens

## Notes

Role mapping: #67AEEE → primary actions/links; #FBD3FF → selected states & secondary accents; #FFDBD0 → warning/warm accents; #D4EEFF → subtle surfaces.
