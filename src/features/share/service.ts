import { and, desc, eq } from "drizzle-orm";
import { customAlphabet } from "nanoid";

import type { Database } from "@/db";
import { folders, shareLinks, type ShareLink } from "@/db/schema";
import { actionError, runAction, type ActionResult } from "@/lib/action-result";
import { z } from "zod";

const generateToken = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  21,
);

export function isValidShare(share: ShareLink) {
  return (
    share.revokedAt === null &&
    (share.expiresAt === null || share.expiresAt > new Date())
  );
}

export async function getActiveSharesForFolder(
  db: Database,
  ownerId: string,
  folderId: string,
): Promise<Array<ShareLink & { folderName: string }>> {
  const rows = await db
    .select({ share: shareLinks, folderName: folders.name })
    .from(shareLinks)
    .innerJoin(folders, eq(folders.id, shareLinks.folderId))
    .where(and(eq(shareLinks.folderId, folderId), eq(shareLinks.createdBy, ownerId)))
    .orderBy(desc(shareLinks.createdAt));
  return rows.map((row) => ({ ...row.share, folderName: row.folderName }));
}

async function getOwnedShare(db: Database, ownerId: string, shareId: string) {
  const [share] = await db
    .select()
    .from(shareLinks)
    .where(and(eq(shareLinks.id, shareId), eq(shareLinks.createdBy, ownerId)))
    .limit(1);
  return share ?? null;
}

export async function createShareForFolder(
  db: Database,
  ownerId: string,
  raw: unknown,
): Promise<ActionResult<ShareLink>> {
  return runAction(async () => {
    const input = z.object({ folderId: z.string().uuid() }).parse(raw);

    const [folder] = await db
      .select()
      .from(folders)
      .where(and(eq(folders.id, input.folderId), eq(folders.ownerId, ownerId)))
      .limit(1);
    if (!folder) return actionError("Folder not found.");

    // Reuse the active share when one already exists.
    const existing = await getActiveSharesForFolder(db, ownerId, input.folderId);
    if (existing.length > 0 && existing[0]) {
      return { ok: true, data: existing[0] };
    }

    const [share] = await db
      .insert(shareLinks)
      .values({
        token: generateToken(),
        folderId: input.folderId,
        createdBy: ownerId,
      })
      .returning();
    if (!share) throw new Error("Insert returned no share");
    return { ok: true, data: share };
  });
}

export async function revokeShare(
  db: Database,
  ownerId: string,
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const input = z.object({ id: z.string().uuid() }).parse(raw);

    const owned = await getOwnedShare(db, ownerId, input.id);
    if (!owned) return actionError("Share not found.");

    const [revoked] = await db
      .update(shareLinks)
      .set({ revokedAt: new Date() })
      .where(eq(shareLinks.id, input.id))
      .returning({ id: shareLinks.id });

    if (!revoked) return actionError("Share not found.");
    return { ok: true, data: revoked };
  });
}

