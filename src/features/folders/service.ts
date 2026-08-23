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
import { getOwnedFolder } from "./queries";
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
  ownerId: string,
  raw: unknown,
): Promise<ActionResult<Folder>> {
  return runAction(async () => {
    const input = createFolderInput.parse(raw);

    if (input.parentId) {
      const parent = await getOwnedFolder(db, ownerId, input.parentId);
      if (!parent) return actionError("Parent folder not found.");

      const parentDepth = await getFolderDepth(db, input.parentId);
      if (parentDepth + 1 > MAX_FOLDER_DEPTH) {
        return actionError(`Folders can be at most ${MAX_FOLDER_DEPTH} levels deep.`);
      }
    }

    try {
      const [folder] = await db
        .insert(folders)
        .values({ ownerId, parentId: input.parentId ?? null, name: input.name })
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
  ownerId: string,
  raw: unknown,
): Promise<ActionResult<Folder>> {
  return runAction(async () => {
    const input = renameFolderInput.parse(raw);

    const folder = await getOwnedFolder(db, ownerId, input.id);
    if (!folder) return actionError("Folder not found.");

    try {
      const [updated] = await db
        .update(folders)
        .set({ name: input.name, updatedAt: new Date() })
        .where(and(eq(folders.id, input.id), eq(folders.ownerId, ownerId)))
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
  ownerId: string,
  raw: unknown,
): Promise<ActionResult<Folder>> {
  return runAction(async () => {
    const input = moveFolderInput.parse(raw);
    const newParentId = input.newParentId ?? null;

    const folder = await getOwnedFolder(db, ownerId, input.id);
    if (!folder) return actionError("Folder not found.");
    if (newParentId === folder.parentId) return { ok: true, data: folder };

    if (newParentId !== null) {
      // Cycle prevention: a folder cannot move into its own subtree.
      const subtreeIds = await resolveSubtreeIds(db, input.id);
      if (subtreeIds.includes(newParentId)) {
        return actionError("Cannot move a folder into itself or one of its subfolders.");
      }

      const parent = await getOwnedFolder(db, ownerId, newParentId);
      if (!parent) return actionError("Destination folder not found.");

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
        .where(and(eq(folders.id, input.id), eq(folders.ownerId, ownerId)))
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

export async function deleteFolder(
  db: Database,
  ownerId: string,
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const input = deleteFolderInput.parse(raw);

    const deleted = await db
      .delete(folders)
      .where(and(eq(folders.id, input.id), eq(folders.ownerId, ownerId)))
      .returning({ id: folders.id });

    if (deleted.length === 0) {
      return actionError("Folder not found.");
    }
    return { ok: true, data: { id: deleted[0]!.id } };
  });
}
