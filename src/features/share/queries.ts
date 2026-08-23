import "server-only";

import { asc, desc, eq, sql } from "drizzle-orm";

import type { Database } from "@/db";
import { getDb } from "@/db";
import { folders, links, shareLinks, type Folder, type Link, type ShareLink } from "@/db/schema";
import { isValidShare } from "./service";

export type ShareView = {
  share: ShareLink;
  root: Folder;
  current: Folder;
  breadcrumb: Array<Pick<Folder, "id" | "name">>;
  subfolders: Folder[];
  links: Link[];
};

/**
 * Returns null when the token is unknown, revoked, expired — or when
 * `requestedFolderId` points outside the shared subtree. Anonymous callers
 * must not learn anything about data outside the scope.
 */
export async function getShareView(
  rawToken: string,
  requestedFolderId?: string | null,
): Promise<ShareView | null> {
  const db = getDb();
  const token = rawToken; // exact-match lookup only

  const [share] = await db.select().from(shareLinks).where(eq(shareLinks.token, token)).limit(1);
  if (!share || !isValidShare(share)) return null;

  const [root] = await db.select().from(folders).where(eq(folders.id, share.folderId)).limit(1);
  if (!root) return null;

  let currentId = root.id;
  if (requestedFolderId && requestedFolderId !== root.id) {
    const inScope = await isInSubtree(db, root.id, requestedFolderId);
    if (!inScope) return null;
    currentId = requestedFolderId;
  }

  const [current] = await db.select().from(folders).where(eq(folders.id, currentId)).limit(1);
  if (!current) return null;

  const [breadcrumbRows, subfolders, folderLinks] = await Promise.all([
    getScopedBreadcrumb(db, root.id, currentId),
    db.select().from(folders).where(eq(folders.parentId, currentId)).orderBy(asc(folders.name)),
    db.select().from(links).where(eq(links.folderId, currentId)).orderBy(desc(links.createdAt)),
  ]);

  return { share, root, current, breadcrumb: breadcrumbRows ?? [], subfolders, links: folderLinks };
}

async function isInSubtree(
  db: Database,
  rootId: string,
  candidateId: string,
): Promise<boolean> {
  const rows = await db.execute<{ found: boolean }>(sql`
    WITH RECURSIVE subtree AS (
      SELECT id FROM folders WHERE id = ${rootId}
      UNION ALL
      SELECT f.id FROM folders f JOIN subtree s ON f.parent_id = s.id
    )
    SELECT EXISTS(SELECT 1 FROM subtree WHERE id = ${candidateId}) AS found
  `);
  const [row] = rows;
  return row?.found === true;
}

/**
 * Ancestor chain within the share scope only: from the share root down to
 * the current folder.
 */
async function getScopedBreadcrumb(
  db: Database,
  rootId: string,
  currentId: string,
): Promise<Array<Pick<Folder, "id" | "name">>> {
  if (rootId === currentId) {
    const [row] = await db
      .select({ id: folders.id, name: folders.name })
      .from(folders)
      .where(eq(folders.id, rootId))
      .limit(1);
    return row ? [row] : [];
  }

  // Ascend only while the current node is not the share root, so ancestors
  // above the share boundary are never read (privacy: their names must not
  // even reach this query's result).
  const rows = await db.execute<{ id: string; name: string; depth: number }>(sql`
    WITH RECURSIVE chain AS (
      SELECT id, parent_id, name, 0 AS depth FROM folders WHERE id = ${currentId}
      UNION ALL
      SELECT f.id, f.parent_id, f.name, c.depth + 1
      FROM folders f JOIN chain c ON f.id = c.parent_id AND c.id != ${rootId}
    )
    SELECT id, name, depth FROM chain WHERE id != ${currentId} ORDER BY depth DESC
  `);

  const breadcrumb: Array<Pick<Folder, "id" | "name">> = [];
  for (const row of rows) {
    breadcrumb.push({ id: row.id, name: row.name });
    if (row.id === rootId) break; // never expose anything above the share root
  }
  // The walk must have reached the share root — otherwise out of scope.
  if (!breadcrumb.some((entry) => entry.id === rootId)) return [];
  return breadcrumb;
}
