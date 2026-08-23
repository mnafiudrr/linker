"use server";

import { requireUser } from "@/features/auth/session";
import { getDb } from "@/db";
import type { Folder } from "@/db/schema";
import type { ActionResult } from "@/lib/action-result";

import {
  createFolder as createFolderInService,
  deleteFolder as deleteFolderInService,
  moveFolder as moveFolderInService,
  renameFolder as renameFolderInService,
} from "../service";

export async function createFolder(raw: unknown): Promise<ActionResult<Folder>> {
  const session = await requireUser();
  return createFolderInService(getDb(), session.user.id, raw);
}

export async function renameFolder(raw: unknown): Promise<ActionResult<Folder>> {
  const session = await requireUser();
  return renameFolderInService(getDb(), session.user.id, raw);
}

export async function moveFolder(raw: unknown): Promise<ActionResult<Folder>> {
  const session = await requireUser();
  return moveFolderInService(getDb(), session.user.id, raw);
}

export async function deleteFolder(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await requireUser();
  return deleteFolderInService(getDb(), session.user.id, raw);
}
