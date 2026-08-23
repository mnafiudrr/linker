import "server-only";

import { and, eq } from "drizzle-orm";

import type { Database } from "@/db";
import { links, type Link } from "@/db/schema";
import { actionError, runAction, type ActionResult } from "@/lib/action-result";
import { getOwnedFolder } from "../folders/queries";
import {
  createLinkInput,
  deleteLinkInput,
  moveLinkInput,
  updateLinkInput,
} from "./schema";
import { getOwnedLink } from "./queries";

export async function createLink(
  db: Database,
  ownerId: string,
  raw: unknown,
): Promise<ActionResult<Link>> {
  return runAction(async () => {
    const input = createLinkInput.parse(raw);

    const folder = await getOwnedFolder(db, ownerId, input.folderId);
    if (!folder) return actionError("Folder not found.");

    const [link] = await db
      .insert(links)
      .values({
        folderId: folder.id,
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
  ownerId: string,
  raw: unknown,
): Promise<ActionResult<Link>> {
  return runAction(async () => {
    const input = updateLinkInput.parse(raw);

    const owned = await getOwnedLink(db, ownerId, input.id);
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
      .where(eq(links.id, input.id))
      .returning();
    if (!updated) throw new Error("Update returned no link");
    return { ok: true, data: updated };
  });
}

export async function moveLink(
  db: Database,
  ownerId: string,
  raw: unknown,
): Promise<ActionResult<Link>> {
  return runAction(async () => {
    const input = moveLinkInput.parse(raw);

    const owned = await getOwnedLink(db, ownerId, input.id);
    if (!owned) return actionError("Link not found.");

    const destination = await getOwnedFolder(db, ownerId, input.newFolderId);
    if (!destination) return actionError("Destination folder not found.");

    const [moved] = await db
      .update(links)
      .set({ folderId: destination.id, updatedAt: new Date() })
      .where(and(eq(links.id, input.id), eq(links.folderId, owned.folder.id)))
      .returning();
    if (!moved) throw new Error("Move returned no link");
    return { ok: true, data: moved };
  });
}

export async function deleteLink(
  db: Database,
  ownerId: string,
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const input = deleteLinkInput.parse(raw);

    const owned = await getOwnedLink(db, ownerId, input.id);
    if (!owned) return actionError("Link not found.");

    const deleted = await db
      .delete(links)
      .where(and(eq(links.id, input.id), eq(links.folderId, owned.folder.id)))
      .returning({ id: links.id });

    if (deleted.length === 0) return actionError("Link not found.");
    return { ok: true, data: { id: deleted[0]!.id } };
  });
}
