# 016 — Folder Collaboration

- **Status:** done
- **Depends on:** [003, 004]
- **GitHub issue:** #14

## Goal

Owners invite existing users (by email) to a folder as **editor** or **viewer**. Invites land in the target user's notification bell (inviter + folder name) for accept/reject. Accepted folders appear under a sidebar **"Shared with me"** group and are browsable; access cascades to subfolders; viewers are read-only (enforced server-side).

## Checklist

### Schema
- [x] `folder_collaborators` table + migration (unique(folder_id, user_id))

### Access layer
- [x] `getFolderAccess(db, userId, folderId)` → owner | editor | viewer | null
- [x] Accepted collab roots resolved via recursive CTE; membership = subtree cascade
- [x] Folder/link services: mutations need owner/editor, reads allow viewer

### Invite flow (`features/collaboration/`)
- [x] `inviteCollaborator` — email must exist, no duplicates/self-invite/pending repeats, owner-only
- [x] `respondToInvitation` — invited user only, while pending
- [x] `removeCollaborator` — owner-only
- [x] Pending-invites query for the bell menu (inviter + folder name)

### UI
- [x] Settings dialog: Collaborators section (email + role select + list/remove)
- [x] Notification bell in dashboard header with badge; accept/reject actions
- [x] Sidebar "Shared with me" group
- [x] Viewer mode hides mutation affordances on non-owned folders

### Quality
- [x] Unit/integration tests: access resolution, role gating, invite lifecycle
- [x] lint / typecheck / tests clean, live smoke check

## Acceptance Criteria

- [x] Full loop works: invite → bell → accept → browse/edit per role → visible under "Shared with me"
- [x] Viewer mutations blocked server-side and hidden client-side
