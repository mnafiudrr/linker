"use server";

import { getDb } from "@/db";
import type { FolderCollaborator } from "@/db/schema";
import { requireUser } from "@/features/auth/session";
import type { ActionResult } from "@/lib/action-result";

import {
  inviteCollaborator as inviteCollaboratorInService,
  removeCollaborator as removeCollaboratorInService,
  respondToInvitation as respondToInvitationInService,
} from "../service";

export async function inviteCollaborator(raw: unknown): Promise<ActionResult<FolderCollaborator>> {
  const session = await requireUser();
  return inviteCollaboratorInService(getDb(), session.user.id, raw);
}

export async function respondToInvitation(
  raw: unknown,
): Promise<ActionResult<{ id: string; status: "accepted" | "rejected" }>> {
  const session = await requireUser();
  return respondToInvitationInService(getDb(), session.user.id, raw);
}

export async function removeCollaborator(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await requireUser();
  return removeCollaboratorInService(getDb(), session.user.id, raw);
}
