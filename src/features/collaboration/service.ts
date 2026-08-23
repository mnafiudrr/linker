import "server-only";

import { and, asc, eq } from "drizzle-orm";

import type { Database } from "@/db";
import {
  folderCollaborators,
  folders,
  users,
  type FolderCollaborator,
} from "@/db/schema";
import { actionError, runAction, type ActionResult } from "@/lib/action-result";
import { getOwnedFolderRow } from "../folders/access";
import { inviteCollaboratorInput, removeCollaboratorInput, respondToInvitationInput } from "./schema";

export async function getPendingInvitesForUser(db: Database, userId: string) {
  return db
    .select({
      id: folderCollaborators.id,
      role: folderCollaborators.role,
      folderName: folders.name,
      folderId: folderCollaborators.folderId,
      inviterName: users.name,
      inviterEmail: users.email,
    })
    .from(folderCollaborators)
    .innerJoin(folders, eq(folders.id, folderCollaborators.folderId))
    .innerJoin(users, eq(users.id, folderCollaborators.invitedBy))
    .where(and(eq(folderCollaborators.userId, userId), eq(folderCollaborators.status, "pending")))
    .orderBy(asc(folderCollaborators.createdAt));
}

export async function getCollaborators(
  db: Database,
  ownerId: string,
  folderId: string,
): Promise<Array<FolderCollaborator & { collaboratorEmail: string }>> {
  const rows = await db
    .select({ collaborator: folderCollaborators, collaboratorEmail: users.email })
    .from(folderCollaborators)
    .innerJoin(users, eq(users.id, folderCollaborators.userId))
    .where(eq(folderCollaborators.folderId, folderId))
    .orderBy(asc(folderCollaborators.createdAt));

  // Only the owner (or the user themselves) may list collaborators.
  const folder = await getOwnedFolderRow(db, ownerId, folderId);
  if (!folder) return [];
  return rows.map((row) => ({ ...row.collaborator, collaboratorEmail: row.collaboratorEmail }));
}

export async function inviteCollaborator(
  db: Database,
  ownerId: string,
  raw: unknown,
): Promise<ActionResult<FolderCollaborator>> {
  return runAction(async () => {
    const input = inviteCollaboratorInput.parse(raw);

    const folder = await getOwnedFolderRow(db, ownerId, input.folderId);
    if (!folder) return actionError("Folder not found.");

    const [target] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, input.email.toLowerCase()))
      .limit(1);
    if (!target) return actionError("No account exists with that email.");

    if (target.id === ownerId) return actionError("You already own this folder.");

    const [existing] = await db
      .select()
      .from(folderCollaborators)
      .where(
        and(eq(folderCollaborators.folderId, folder.id), eq(folderCollaborators.userId, target.id)),
      )
      .limit(1);
    if (existing) return actionError("This user is already a collaborator on the folder.");

    const [invite] = await db
      .insert(folderCollaborators)
      .values({
        folderId: folder.id,
        userId: target.id,
        invitedBy: ownerId,
        role: input.role,
        status: "pending",
      })
      .returning();
    if (!invite) throw new Error("Insert returned no invite");
    return { ok: true, data: invite };
  });
}

export async function respondToInvitation(
  db: Database,
  userId: string,
  raw: unknown,
): Promise<ActionResult<{ id: string; status: "accepted" | "rejected" }>> {
  return runAction(async () => {
    const input = respondToInvitationInput.parse(raw);

    const [invite] = await db
      .select()
      .from(folderCollaborators)
      .where(and(eq(folderCollaborators.id, input.id), eq(folderCollaborators.userId, userId)))
      .limit(1);

    if (!invite || invite.status !== "pending") {
      return actionError("Invitation not found or already handled.");
    }

    const status = input.accept ? ("accepted" as const) : ("rejected" as const);
    const [updated] = await db
      .update(folderCollaborators)
      .set({ status, respondedAt: new Date() })
      .where(eq(folderCollaborators.id, invite.id))
      .returning();
    if (!updated) throw new Error("Update returned no invitation");
    return { ok: true, data: { id: updated.id, status } };
  });
}

export async function removeCollaborator(
  db: Database,
  ownerId: string,
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const input = removeCollaboratorInput.parse(raw);

    // The collaborator row anchors to a folder — verify ownership of it.
    const [row] = await db
      .select({ collab: folderCollaborators, ownerId: folders.ownerId })
      .from(folderCollaborators)
      .innerJoin(folders, eq(folders.id, folderCollaborators.folderId))
      .where(eq(folderCollaborators.id, input.id))
      .limit(1);

    if (!row || row.ownerId !== ownerId) return actionError("Collaborator not found.");

    const deleted = await db
      .delete(folderCollaborators)
      .where(eq(folderCollaborators.id, row.collab.id))
      .returning({ id: folderCollaborators.id });

    if (deleted.length === 0) return actionError("Collaborator not found.");
    return { ok: true, data: { id: deleted[0]!.id } };
  });
}
