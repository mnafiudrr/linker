import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getDb } from "@/db";
import { folderCollaborators, users } from "@/db/schema";
import { createFolder } from "@/features/folders/service";
import { createLink } from "@/features/links/service";
import {
  getCollaborators,
  inviteCollaborator,
  removeCollaborator,
  respondToInvitation,
} from "./service";
import { deleteFolder } from "@/features/folders/service";
import { getFolderAccess } from "@/features/folders/access";

process.env.DATABASE_URL ??= "postgres://link:link@localhost:5432/link";

const db = getDb();

let ownerId: string;
let editorId: string;
let viewerId: string;
let rootId: string;

beforeAll(async () => {
  const stamp = Date.now();
  const rows = await db
    .insert(users)
    .values([
      { id: `co-${stamp}`, name: "O", email: `o${stamp}@example.com`, emailVerified: true },
      { id: `ce-${stamp}`, name: "E", email: `e${stamp}@example.com`, emailVerified: true },
      { id: `cv-${stamp}`, name: "V", email: `v${stamp}@example.com`, emailVerified: true },
    ])
    .returning();
  if (rows.length < 3) throw new Error("failed to seed users");
  [ownerId, editorId, viewerId] = rows.map((r) => r.id) as [string, string, string];

  const root = await createFolder(db, ownerId, { name: `collab-root-${stamp}` });
  if (!root.ok) throw new Error(root.message);
  rootId = root.data.id;
});

afterAll(async () => {
  await db.delete(users).where(eq(users.id, ownerId));
});

describe("inviteCollaborator", () => {
  it("creates a pending invite for an existing user", async () => {
    const result = await inviteCollaborator(db, ownerId, {
      folderId: rootId,
      email: (await db.select({ e: users.email }).from(users).where(eq(users.id, editorId)))[0]?.e,
      role: "editor",
    });
    expect(result).toMatchObject({ ok: true, data: { role: "editor", status: "pending" } });
  });

  it("rejects unknown emails, self-invites, and duplicates", async () => {
    const ownerEmail =
      (await db.select({ e: users.email }).from(users).where(eq(users.id, ownerId)))[0]?.e ?? "";

    expect(
      await inviteCollaborator(db, ownerId, { folderId: rootId, email: "ghost@x.com", role: "viewer" }),
    ).toMatchObject({ ok: false, message: "No account exists with that email." });

    expect(
      await inviteCollaborator(db, ownerId, { folderId: rootId, email: ownerEmail, role: "viewer" }),
    ).toMatchObject({ ok: false });

    expect(
      await inviteCollaborator(db, ownerId, {
        folderId: rootId,
        email: (await db.select({ e: users.email }).from(users).where(eq(users.id, editorId)))[0]!.e,
        role: "editor",
      }),
    ).toMatchObject({ ok: false });
  });
});

describe("access resolution", () => {
  it("grants no access before acceptance", async () => {
    expect(await getFolderAccess(db, viewerId, rootId)).toBeNull();
  });

  it("cascades accepted roles through the subtree", async () => {
    const child = await createFolder(db, ownerId, { name: "sub", parentId: rootId });
    if (!child.ok) throw new Error(child.message);

    // Accept the editor's invite.
    const invites = await db
      .select()
      .from(folderCollaborators)
      .where(eq(folderCollaborators.userId, editorId));
    const accepted = await respondToInvitation(db, editorId, {
      id: invites[0]!.id,
      accept: true,
    });
    expect(accepted).toMatchObject({ ok: true, data: { status: "accepted" } });

    expect(await getFolderAccess(db, editorId, rootId)).toBe("editor");
    expect(await getFolderAccess(db, editorId, child.data.id)).toBe("editor");
  });
});

describe("role gating", () => {
  it("lets editors mutate content but not delete the shared root", async () => {
    const link = await createLink(db, editorId, {
      folderId: rootId,
      url: "https://example.com/collab",
      title: "By editor",
    });
    expect(link.ok).toBe(true);

    const delRoot = await deleteFolder(db, editorId, { id: rootId });
    expect(delRoot).toMatchObject({
      ok: false,
      message: "Editors cannot delete the shared folder itself.",
    });
  });

  it("blocks viewers from mutating", async () => {
    const invite = await inviteCollaborator(db, ownerId, {
      folderId: rootId,
      email:
        (await db.select({ e: users.email }).from(users).where(eq(users.id, viewerId)))[0]?.e ?? "",
      role: "viewer",
    });
    if (!invite.ok) throw new Error(invite.message);
    await respondToInvitation(db, viewerId, { id: invite.data.id, accept: true });

    expect(await getFolderAccess(db, viewerId, rootId)).toBe("viewer");
    expect(
      await createLink(db, viewerId, {
        folderId: rootId,
        url: "https://example.com/nope",
        title: "nope",
      }),
    ).toMatchObject({ ok: false, message: "You have view-only access to this folder." });
  });
});

describe("invitation responses and removal", () => {
  it("lists collaborators for the owner with emails", async () => {
    const list = await getCollaborators(db, ownerId, rootId);
    expect(list.length).toBeGreaterThanOrEqual(2);
    expect(list.every((row) => row.collaboratorEmail.includes("@"))).toBe(true);
  });

  it("removes a collaborator, revoking access", async () => {
    const list = await getCollaborators(db, ownerId, rootId);
    const viewerRow = list.find((row) => row.userId === viewerId);
    expect(viewerRow).toBeTruthy();

    const removed = await removeCollaborator(db, ownerId, { id: viewerRow!.id });
    expect(removed.ok).toBe(true);
    expect(await getFolderAccess(db, viewerId, rootId)).toBeNull();
  });
});
