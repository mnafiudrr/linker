import "server-only";

import { and, desc, eq } from "drizzle-orm";

import type { Database } from "@/db";
import { getDb } from "@/db";
import { links, type Link } from "@/db/schema";
import { actionError, runAction, type ActionResult } from "@/lib/action-result";
import { canWrite, getFolderAccess } from "../folders/access";
import {
  createLinkInput,
  deleteLinkInput,
  moveLinkInput,
  updateLinkInput,
} from "./schema";

export async function getLinksInFolder(folderId: string): Promise<Link[]> {
  return getDb()
    .select()
    .from(links)
    .where(eq(links.folderId, folderId))
    .orderBy(desc(links.createdAt));
}

/** Returns the link when the user holds write access to its folder. */
async function getWritableLink(
  db: Database,
  userId: string,
  linkId: string,
): Promise<{ link: Link; folderId: string } | null> {
  const [link] = await db.select().from(links).where(eq(links.id, linkId)).limit(1);
  if (!link) return null;
  const writable = await canWrite(db, userId, link.folderId);
  return writable ? { link, folderId: link.folderId } : null;
}

export async function createLink(
  db: Database,
  userId: string,
  raw: unknown,
): Promise<ActionResult<Link>> {
  return runAction(async () => {
    const input = createLinkInput.parse(raw);

    const access = await getFolderAccess(db, userId, input.folderId);
    if (access === null) return actionError("Folder not found.");
    if (access === "viewer") return actionError("You have view-only access to this folder.");

    const [link] = await db
      .insert(links)
      .values({
        folderId: input.folderId,
        url: input.url,
        title: input.title,
        description: input.description ?? null,
        faviconUrl: input.faviconUrl ?? null,
        imageUrl: input.imageUrl ?? null,
      })
      .returning();
    if (!link) throw new Error("Insert returned no link");
    return { ok: true, data: link };
  });
}

export async function updateLink(
  db: Database,
  userId: string,
  raw: unknown,
): Promise<ActionResult<Link>> {
  return runAction(async () => {
    const input = updateLinkInput.parse(raw);

    const owned = await getWritableLink(db, userId, input.id);
    if (!owned) return actionError("Link not found.");

    const [updated] = await db
      .update(links)
      .set({
        url: input.url,
        title: input.title,
        description: input.description ?? null,
        faviconUrl: input.faviconUrl ?? null,
        imageUrl: input.imageUrl ?? null,
        updatedAt: new Date(),
      })
      .where(and(eq(links.id, input.id), eq(links.folderId, owned.folderId)))
      .returning();
    if (!updated) throw new Error("Update returned no link");
    return { ok: true, data: updated };
  });
}

export async function moveLink(
  db: Database,
  userId: string,
  raw: unknown,
): Promise<ActionResult<Link>> {
  return runAction(async () => {
    const input = moveLinkInput.parse(raw);

    const owned = await getWritableLink(db, userId, input.id);
    if (!owned) return actionError("Link not found.");

    // Write access required on both ends of the move.
    const sourceOk = await canWrite(db, userId, owned.folderId);
    const destinationOk = await canWrite(db, userId, input.newFolderId);
    if (!sourceOk || !destinationOk) return actionError("Link not found.");
    const destinationAccess = await getFolderAccess(db, userId, input.newFolderId);
    if (destinationAccess === "viewer") {
      return actionError("You have view-only access to the destination folder.");
    }

    const [moved] = await db
      .update(links)
      .set({ folderId: input.newFolderId, updatedAt: new Date() })
      .where(and(eq(links.id, input.id), eq(links.folderId, owned.folderId)))
      .returning();
    if (!moved) throw new Error("Move returned no link");
    return { ok: true, data: moved };
  });
}

export async function deleteLink(
  db: Database,
  userId: string,
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const input = deleteLinkInput.parse(raw);

    const owned = await getWritableLink(db, userId, input.id);
    if (!owned) return actionError("Link not found.");

    const deleted = await db
      .delete(links)
      .where(and(eq(links.id, input.id), eq(links.folderId, owned.folderId)))
      .returning({ id: links.id });

    if (deleted.length === 0) return actionError("Link not found.");
    return { ok: true, data: { id: deleted[0]!.id } };
  });
}
