# 012 — Sidebar: "My links" Root + Shared Groups

- **Status:** done
- **Depends on:** none
- **GitHub issue:** #5

## Goal

Sidebar shows a pinned **"My links"** entry (links to Home/root view) above the folder tree, and a grouped **Shared** section listing owned folders that have active share links, each linking directly into the folder with a share indicator.

## Checklist

- [x] New query `getSharedFolders(ownerId)` — folders joined to active `share_links`
- [x] FolderTree: pinned "My links" entry; "Shared" group below the tree
- [x] Share indicator on shared entries; revoking removes them from sidebar
- [x] lint / typecheck / tests clean, live smoke check

## Acceptance Criteria

- [x] Sidebar layout: My links → tree → Shared
- [x] Shared list reflects create/revoke immediately

## Notes

Active share = `revoked_at IS NULL AND (expires_at IS NULL OR expires_at > now())`.
