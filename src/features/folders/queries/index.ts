import "server-only";

import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";

import type { Database } from "@/db";
import { getDb } from "@/db";
import {
  folders,
  links,
  shareLinks,
  type Folder,
  type Link,
} from "@/db/schema";
import { getFolderAccess } from "../access";

export function getRootFolders(ownerId: string) {
  return getDb()
    .select()
    .from(folders)
    .where(and(eq(folders.ownerId, ownerId), isNull(folders.parentId)))
    .orderBy(asc(folders.name));
}

/** Flat list of all owned folders — the sidebar tree is built client-side. */
export function getAllOwnedFolders(ownerId: string) {
  return getDb()
    .select({ id: folders.id, name: folders.name, parentId: folders.parentId })
    .from(folders)
    .where(eq(folders.ownerId, ownerId))
    .orderBy(asc(folders.name));
}

/**
 * Owned folders that currently have an active share link — rendered as the
 * sidebar's "Shared" group. Active = not revoked and not expired.
 */
export function getSharedFolders(ownerId: string) {
  return getDb()
    .selectDistinct({
      id: folders.id,
      name: folders.name,
      token: shareLinks.token,
    })
    .from(shareLinks)
    .innerJoin(folders, eq(folders.id, shareLinks.folderId))
    .where(
      and(
        eq(shareLinks.createdBy, ownerId),
        isNull(shareLinks.revokedAt),
        sql`(${shareLinks.expiresAt} IS NULL OR ${shareLinks.expiresAt} > now())`,
      ),
    )
    .orderBy(asc(folders.name));
}

/**
 * Folders shared *with* the user via accepted collaboration — the sidebar's
 * "Shared with me" group.
 */
export function getCollaborations(userId: string) {
  return getDb()
    .selectDistinct({ id: folders.id, name: folders.name })
    .from(folders)
    .innerJoin(
      sql`folder_collaborators fc`,
      sql`fc.folder_id = ${folders.id} AND fc.user_id = ${userId} AND fc.status = 'accepted'`,
    )
    .orderBy(asc(folders.name));
}

export type FolderContents = {
  folder: Folder;
  subfolders: Folder[];
  links: Link[];
  access: "owner" | "editor" | "viewer";
};

export async function getFolderContents(
  userId: string,
  folderId: string,
): Promise<FolderContents | null> {
  const db = getDb();

  const access = await getFolderAccess(db, userId, folderId);
  if (access === null) return null;

  const [folder] = await db.select().from(folders).where(eq(folders.id, folderId)).limit(1);
  if (!folder) return null;

  const [subfolders, folderLinks] = await Promise.all([
    db.select().from(folders).where(eq(folders.parentId, folderId)).orderBy(asc(folders.name)),
    db.select().from(links).where(eq(links.folderId, folderId)).orderBy(desc(links.createdAt)),
  ]);

  return { folder, subfolders, links: folderLinks, access };
}

/**
 * Ancestor chain for breadcrumbs, ordered root → current (inclusive).
 * For collaborators the path starts at their accepted collaboration root.
 */
export async function getBreadcrumb(
  userId: string,
  folderId: string,
): Promise<Array<Pick<Folder, "id" | "name">> | null> {
  const db = getDb();

  const rows = await db.execute<{ id: string; name: string; owner_id: string; depth: number }>(sql`
    WITH RECURSIVE ancestors AS (
      SELECT id, parent_id, owner_id, name, 0 AS depth
      FROM folders WHERE id = ${folderId}
      UNION ALL
      SELECT f.id, f.parent_id, f.owner_id, f.name, a.depth + 1
      FROM folders f JOIN ancestors a ON f.id = a.parent_id
    )
    SELECT id, name, owner_id, depth FROM ancestors ORDER BY depth DESC
  `);

  if (rows.length === 0) return null;

  const access = await getFolderAccess(db, userId, folderId);
  if (access === null) return null;

  if (access === "owner") {
    // The whole chain belongs to the user — show it all (topmost-first).
    return rows.map((row) => ({ id: row.id, name: row.name }));
  }

  // Non-owner: start the path at the highest accepted collaboration root.
  const collabRows = await db.execute<{ id: string; depth: number }>(sql`
    WITH RECURSIVE ancestors AS (
      SELECT id, parent_id, 0 AS depth FROM folders WHERE id = ${folderId}
      UNION ALL
      SELECT f.id, f.parent_id, a.depth + 1 FROM folders f JOIN ancestors a ON f.id = a.parent_id
    )
    SELECT c.id AS id, MIN(c.depth) AS depth
    FROM ancestors c JOIN folder_collaborators fc ON fc.folder_id = c.id
    WHERE fc.user_id = ${userId} AND fc.status = 'accepted'
    GROUP BY c.id ORDER BY depth ASC LIMIT 1
  `);
  const [collabRoot] = collabRows;
  if (!collabRoot) return null;

  const startDepth = Number(collabRoot.depth);
  const chain = rows.filter((row) => Number(row.depth) >= startDepth);
  return chain.map((row) => ({ id: row.id, name: row.name }));
}

export async function getOwnedFolder(
  db: Database,
  ownerId: string,
  folderId: string,
): Promise<Folder | null> {
  const [folder] = await db
    .select()
    .from(folders)
    .where(and(eq(folders.id, folderId), eq(folders.ownerId, ownerId)))
    .limit(1);
  return folder ?? null;
}
