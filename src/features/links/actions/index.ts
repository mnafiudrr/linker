"use server";

import { getDb } from "@/db";
import type { Link } from "@/db/schema";
import { requireUser } from "@/features/auth/session";
import type { ActionResult } from "@/lib/action-result";

import {
  createLink as createLinkInService,
  deleteLink as deleteLinkInService,
  moveLink as moveLinkInService,
  updateLink as updateLinkInService,
} from "../service";

export async function createLink(raw: unknown): Promise<ActionResult<Link>> {
  const session = await requireUser();
  return createLinkInService(getDb(), session.user.id, raw);
}

export async function updateLink(raw: unknown): Promise<ActionResult<Link>> {
  const session = await requireUser();
  return updateLinkInService(getDb(), session.user.id, raw);
}

export async function moveLink(raw: unknown): Promise<ActionResult<Link>> {
  const session = await requireUser();
  return moveLinkInService(getDb(), session.user.id, raw);
}

export async function deleteLink(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await requireUser();
  return deleteLinkInService(getDb(), session.user.id, raw);
}
