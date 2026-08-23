"use server";

import { getDb } from "@/db";
import type { ShareLink } from "@/db/schema";
import { requireUser } from "@/features/auth/session";
import type { ActionResult } from "@/lib/action-result";

import { createShareForFolder, revokeShare as revokeShareInService } from "../service";

export async function createShare(raw: unknown): Promise<ActionResult<ShareLink>> {
  const session = await requireUser();
  return createShareForFolder(getDb(), session.user.id, raw);
}

export async function revokeShare(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await requireUser();
  return revokeShareInService(getDb(), session.user.id, raw);
}
