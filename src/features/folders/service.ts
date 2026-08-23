import "server-only";

import { and, eq } from "drizzle-orm";

import type { Database } from "@/db";
import { folders, type Folder } from "@/db/schema";
import {
  actionError,
  runAction,
  type ActionResult,
} from "@/lib/action-result";
import {
  createFolderInput,
  deleteFolderInput,
  MAX_FOLDER_DEPTH,
  moveFolderInput,
  renameFolderInput,
} from "./schema";
import { getFolderAccess } from "./access";
import { getFolderDepth, getSubtreeHeight, resolveSubtreeIds } from "./queries/subtree";

function isUniqueViolation(error: unknown) {
  // Drizzle wraps driver errors — the pg error code lives on `cause`.
  for (let current: unknown = error; current instanceof Error; current = current.cause) {
    if ("code" in current && current.code === "23505") return true;
  }
  return false;
}

export async function createFolder(
  db: Database,
  userId: string,
  raw: unknown,
): Promise<ActionResult<Folder>> {
  return runAction(async () => {
    const input = createFolderInput.parse(raw);

    let parentOwnerId = userId;
    if (input.parentId) {
      const parentAccess = await getFolderAccess(db, userId, input.parentId);
      if (parentAccess === null) return actionError("Parent folder not found.");
      if (parentAccess === "viewer") {
        return actionError("You have view-only access to this folder.");
      }
      const [parent] = await db
        .select({ ownerId: folders.ownerId })
        .from(folders)
        .where(eq(folders.id, input.parentId))
        .limit(1);
      // Folders created inside another user's tree belong to the tree owner,
      // keeping cascade deletes and access semantics consistent. Editors gain
      // visibility through ancestor collaboration instead of ownership.
      parentOwnerId = parent?.ownerId ?? userId;

      const parentDepth = await getFolderDepth(db, input.parentId);
      if (parentDepth + 1 > MAX_FOLDER_DEPTH) {
        return actionError(`Folders can be at most ${MAX_FOLDER_DEPTH} levels deep.`);
      }
    }

    try {
      const [folder] = await db
        .insert(folders)
        .values({ ownerId: parentOwnerId, parentId: input.parentId ?? null, name: input.name })
        .returning();
      if (!folder) throw new Error("Insert returned no folder");
      return { ok: true, data: folder };
    } catch (error) {
      if (isUniqueViolation(error)) {
        return actionError("A folder with this name already exists here.");
      }
      throw error;
    }
  });
}

export async function renameFolder(
  db: Database,
  userId: string,
  raw: unknown,
): Promise<ActionResult<Folder>> {
  return runAction(async () => {
    const input = renameFolderInput.parse(raw);

    const folder = await getFolderForWrite(db, userId, input.id);
    if (!folder) return actionError("Folder not found.");

    try {
      const [updated] = await db
        .update(folders)
        .set({ name: input.name, updatedAt: new Date() })
        .where(eq(folders.id, input.id))
        .returning();
      if (!updated) throw new Error("Update returned no folder");
      return { ok: true, data: updated };
    } catch (error) {
      if (isUniqueViolation(error)) {
        return actionError("A folder with this name already exists here.");
      }
      throw error;
    }
  });
}

export async function moveFolder(
  db: Database,
  userId: string,
  raw: unknown,
): Promise<ActionResult<Folder>> {
  return runAction(async () => {
    const input = moveFolderInput.parse(raw);
    const newParentId = input.newParentId ?? null;

    const folder = await getFolderForWrite(db, userId, input.id);
    if (!folder) return actionError("Folder not found.");
    if (newParentId === folder.parentId) return { ok: true, data: folder };

    if (newParentId !== null) {
      // Cycle prevention: a folder cannot move into its own subtree.
      const subtreeIds = await resolveSubtreeIds(db, input.id);
      if (subtreeIds.includes(newParentId)) {
        return actionError("Cannot move a folder into itself or one of its subfolders.");
      }

      const destinationAccess = await getFolderAccess(db, userId, newParentId);
      if (destinationAccess === null) return actionError("Destination folder not found.");
      if (destinationAccess === "viewer") {
        return actionError("You have view-only access to the destination folder.");
      }

      const parentDepth = await getFolderDepth(db, newParentId);
      const height = await getSubtreeHeight(db, input.id);
      if (parentDepth + 1 + height > MAX_FOLDER_DEPTH) {
        return actionError(
          `This move would exceed the ${MAX_FOLDER_DEPTH}-level depth limit.`,
        );
      }
    }

    try {
      const [moved] = await db
        .update(folders)
        .set({ parentId: newParentId, updatedAt: new Date() })
        .where(eq(folders.id, input.id))
        .returning();
      if (!moved) throw new Error("Move returned no folder");
      return { ok: true, data: moved };
    } catch (error) {
      if (isUniqueViolation(error)) {
        return actionError("A folder with this name already exists in the destination.");
      }
      throw error;
    }
  });
}

/**
 * Deletion needs write access, and editors may never delete the folder that
 * anchors someone else's collaboration grant (that would destroy the owner's
 * tree root).
 */
async function getFolderForDelete(
  db: Database,
  userId: string,
  folderId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const access = await getFolderAccess(db, userId, folderId);
  if (access === null) return { ok: false, message: "Folder not found." };
  if (access === "viewer") return { ok: false, message: "You have view-only access." };

  if (access !== "owner") {
    const [row] = await db
      .select({ id: folders.id })
      .from(folders)
      .where(and(eq(folders.id, folderId), eq(folders.ownerId, userId)))
      .limit(1);
    if (!row) {
      return {
        ok: false,
        message: "Editors cannot delete the shared folder itself.",
      };
    }
  }
  return { ok: true };
}

export async function deleteFolder(
  db: Database,
  userId: string,
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const input = deleteFolderInput.parse(raw);

    const allowed = await getFolderForDelete(db, userId, input.id);
    if (!allowed.ok) return actionError(allowed.message);

    const deleted = await db
      .delete(folders)
      .where(eq(folders.id, input.id))
      .returning({ id: folders.id });

    if (deleted.length === 0) {
      return actionError("Folder not found.");
    }
    return { ok: true, data: { id: deleted[0]!.id } };
  });
}

/** Returns the folder row when the user holds write access, else null. */
async function getFolderForWrite(
  db: Database,
  userId: string,
  folderId: string,
): Promise<Folder | null> {
  const [folder] = await db.select().from(folders).where(eq(folders.id, folderId)).limit(1);
  if (!folder) return null;

  // Cheap ownership short-circuit before the access CTE.
  if (folder.ownerId === userId) return folder;
  const access = await getFolderAccess(db, userId, folderId);
  return access === "owner" || access === "editor" ? folder : null;
}
