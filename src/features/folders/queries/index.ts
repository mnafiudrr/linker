import "server-only";

import { and, asc, desc, eq, gt, isNull, or, sql } from "drizzle-orm";

import type { Database } from "@/db";
import { getDb } from "@/db";
import { folders, links, shareLinks, type Folder, type Link } from "@/db/schema";

export type FolderWithContents = {
  folder: Folder;
  subfolders: Folder[];
  links: Link[];
};

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
        or(isNull(shareLinks.expiresAt), gt(shareLinks.expiresAt, sql`now()`)),
      ),
    )
    .orderBy(asc(folders.name));
}

export async function getFolderContents(
  ownerId: string,
  folderId: string,
): Promise<FolderWithContents | null> {
  const db = getDb();

  const [folder] = await db
    .select()
    .from(folders)
    .where(and(eq(folders.id, folderId), eq(folders.ownerId, ownerId)))
    .limit(1);
  if (!folder) return null;

  const [subfolders, folderLinks] = await Promise.all([
    db.select().from(folders).where(eq(folders.parentId, folderId)).orderBy(asc(folders.name)),
    db.select().from(links).where(eq(links.folderId, folderId)).orderBy(desc(links.createdAt)),
  ]);

  return { folder, subfolders, links: folderLinks };
}

/**
 * Ancestor chain for breadcrumbs, ordered root → current folder.
 * The current folder is included as the last entry. Returns null when the
 * folder does not exist or belongs to another user.
 */
export async function getBreadcrumb(
  ownerId: string,
  folderId: string,
): Promise<Array<Pick<Folder, "id" | "name">> | null> {
  const rows = await getDb().execute<{ id: string; name: string; depth: number }>(sql`
    WITH RECURSIVE ancestors AS (
      SELECT id, parent_id, owner_id, name, 0 AS depth
      FROM folders WHERE id = ${folderId}
      UNION ALL
      SELECT f.id, f.parent_id, f.owner_id, f.name, a.depth + 1
      FROM folders f JOIN ancestors a ON f.id = a.parent_id
    )
    SELECT id, name, depth FROM ancestors WHERE owner_id = ${ownerId} ORDER BY depth DESC
  `);

  if (rows.length === 0) return null;
  return rows.map((row) => ({ id: row.id, name: row.name }));
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
