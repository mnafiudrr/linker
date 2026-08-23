import "server-only";

import { desc, eq } from "drizzle-orm";

import type { Database } from "@/db";
import { getDb } from "@/db";
import { folders, links, type Folder, type Link } from "@/db/schema";

export async function getLinksInFolder(folderId: string): Promise<Link[]> {
  return getDb()
    .select()
    .from(links)
    .where(eq(links.folderId, folderId))
    .orderBy(desc(links.createdAt));
}

/** Returns the link only when it lives in a folder owned by `ownerId`. */
export async function getOwnedLink(
  db: Database,
  ownerId: string,
  linkId: string,
): Promise<{ link: Link; folder: Folder } | null> {
  const [row] = await db
    .select({ link: links, folder: folders })
    .from(links)
    .innerJoin(folders, eq(folders.id, links.folderId))
    .where(eq(links.id, linkId))
    .limit(1);

  if (!row || row.folder.ownerId !== ownerId) return null;
  return row;
}
