import "server-only";

import { and, eq, sql } from "drizzle-orm";

import type { Database } from "@/db";
import { folders } from "@/db/schema";

export type FolderAccess = "owner" | "editor" | "viewer" | null;

/**
 * Resolves the acting user's access to a folder:
 * - `owner`  — created it (full control, collaborator management)
 * - `editor` — accepted editor collaboration on this folder or an ancestor
 * - `viewer` — accepted viewer collaboration on this folder or an ancestor
 * - `null`   — no access
 *
 * Collaboration cascades down the subtree, mirroring public share semantics.
 */
export async function getFolderAccess(
  db: Database,
  userId: string,
  folderId: string,
): Promise<FolderAccess> {
  const rows = await db.execute<{ access: FolderAccess }>(sql`
    WITH RECURSIVE chain AS (
      SELECT id, parent_id, owner_id FROM folders WHERE id = ${folderId}
      UNION ALL
      SELECT f.id, f.parent_id, f.owner_id FROM folders f JOIN chain c ON f.id = c.parent_id
    )
    SELECT
      CASE
        WHEN EXISTS (SELECT 1 FROM chain WHERE owner_id = ${userId}) THEN 'owner'
        WHEN EXISTS (
          SELECT 1 FROM chain c
          JOIN folder_collaborators fc ON fc.folder_id = c.id
          WHERE fc.user_id = ${userId} AND fc.status = 'accepted' AND fc.role = 'editor'
        ) THEN 'editor'
        WHEN EXISTS (
          SELECT 1 FROM chain c
          JOIN folder_collaborators fc ON fc.folder_id = c.id
          WHERE fc.user_id = ${userId} AND fc.status = 'accepted' AND fc.role = 'viewer'
        ) THEN 'viewer'
        ELSE NULL
      END AS access
  `);
  const [row] = rows;
  return row?.access ?? null;
}

/** True when the user may mutate content in/under the folder. */
export async function canWrite(db: Database, userId: string, folderId: string) {
  const access = await getFolderAccess(db, userId, folderId);
  return access === "owner" || access === "editor";
}

/** The folder row when the user owns it, else null. */
export async function getOwnedFolderRow(db: Database, userId: string, folderId: string) {
  const [folder] = await db
    .select()
    .from(folders)
    .where(and(eq(folders.id, folderId), eq(folders.ownerId, userId)))
    .limit(1);
  return folder ?? null;
}
