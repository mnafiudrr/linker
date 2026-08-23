import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getDb } from "@/db";
import { links, users } from "@/db/schema";
import { createFolder } from "@/features/folders/service";
import {
  createLink,
  deleteLink,
  moveLink,
  updateLink,
} from "./service";

process.env.DATABASE_URL ??= "postgres://link:link@localhost:5432/link";

const db = getDb();

let ownerId: string;
let folderId: string;
let otherFolderId: string;

beforeAll(async () => {
  const stamp = Date.now();
  const [user] = await db
    .insert(users)
    .values({ id: `t-${stamp}`, name: "T", email: `l${stamp}@example.com`, emailVerified: true })
    .returning();
  if (!user) throw new Error("failed to create test user");
  ownerId = user.id;

  const root = await createFolder(db, ownerId, { name: `lf-${stamp}` });
  if (!root.ok) throw new Error(root.message);
  folderId = root.data.id;

  const other = await createFolder(db, ownerId, { name: `lo-${stamp}` });
  if (!other.ok) throw new Error(other.message);
  otherFolderId = other.data.id;
});

afterAll(async () => {
  await db.delete(users).where(eq(users.id, ownerId));
});

describe("link CRUD", () => {
  it("creates a link with optional metadata fields", async () => {
    const result = await createLink(db, ownerId, {
      folderId,
      url: "https://example.com/article",
      title: "An Article",
      description: "Some description",
      imageUrl: "https://example.com/og.png",
    });

    expect(result).toMatchObject({
      ok: true,
      data: { title: "An Article", faviconUrl: null, metadataFetchedAt: null },
    });
  });

  it("rejects non-http(s) URLs and empty titles", async () => {
    expect(
      await createLink(db, ownerId, { folderId, url: "ftp://example.com", title: "x" }),
    ).toMatchObject({ ok: false });
    expect(
      await createLink(db, ownerId, { folderId, url: "not a url", title: "x" }),
    ).toMatchObject({ ok: false });
    expect(
      await createLink(db, ownerId, { folderId, url: "https://example.com", title: "  " }),
    ).toMatchObject({ ok: false });
  });

  it("rejects creating into a missing or foreign folder", async () => {
    const result = await createLink(db, ownerId, {
      folderId: "00000000-0000-0000-0000-000000000000",
      url: "https://example.com",
      title: "x",
    });
    expect(result).toMatchObject({ ok: false, message: "Folder not found." });
  });

  it("updates and moves an owned link", async () => {
    const created = await createLink(db, ownerId, {
      folderId,
      url: "https://example.com/a",
      title: "A",
    });
    if (!created.ok) throw new Error(created.message);

    const updated = await updateLink(db, ownerId, {
      id: created.data.id,
      url: "https://example.com/b",
      title: "B",
    });
    expect(updated).toMatchObject({ ok: true, data: { title: "B" } });

    const moved = await moveLink(db, ownerId, { id: created.data.id, newFolderId: otherFolderId });
    expect(moved).toMatchObject({ ok: true, data: { folderId: otherFolderId } });

    const movedBack = await moveLink(db, ownerId, { id: created.data.id, newFolderId: folderId });
    expect(movedBack).toMatchObject({ ok: true });
  });

  it("deletes an owned link only once", async () => {
    const stamp = Date.now();
    const scratch = await createFolder(db, ownerId, { name: `del-${stamp}` });
    if (!scratch.ok) throw new Error(scratch.message);

    const created = await createLink(db, ownerId, {
      folderId: scratch.data.id,
      url: "https://example.com/del",
      title: "Del",
    });
    if (!created.ok) throw new Error(created.message);

    const deleted = await deleteLink(db, ownerId, { id: created.data.id });
    expect(deleted).toMatchObject({ ok: true, data: { id: created.data.id } });
    const remaining = await db
      .select()
      .from(links)
      .where(eq(links.folderId, scratch.data.id));
    expect(remaining).toHaveLength(0);
  });
});
