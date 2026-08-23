import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getDb } from "@/db";
import { folders, links, users } from "@/db/schema";
import { getAncestorIds, getFolderDepth, resolveSubtreeIds } from "./subtree";

process.env.DATABASE_URL ??= "postgres://link:link@localhost:5432/link";

const db = getDb();

let userId: string;

beforeAll(async () => {
  const [user] = await db
    .insert(users)
    .values({
      id: `test-user-${Date.now()}`,
      name: "Test",
      email: `t${Date.now()}@example.com`,
      emailVerified: true,
    })
    .returning();
  if (!user) throw new Error("failed to create test user");
  userId = user.id;
});

afterAll(async () => {
  await db.delete(users).where(eq(users.id, userId));
});

async function insertFolder(parentId: string | null, name: string) {
  const [row] = await db
    .insert(folders)
    .values({ ownerId: userId, parentId, name })
    .returning();
  if (!row) throw new Error(`failed to create folder ${name}`);
  return row;
}

describe("folder tree queries", () => {
  it("resolves the full subtree of a nested folder", async () => {
    const root = await insertFolder(null, "root");
    const child = await insertFolder(root.id, "child");
    await insertFolder(child.id, "grandchild");

    const ids = await resolveSubtreeIds(db, root.id);

    expect(ids).toHaveLength(3);
    expect(ids).toContain(root.id);
    expect(ids).toContain(child.id);
  });

  it("cascade-deletes descendant folders and links", async () => {
    const root = await insertFolder(null, "cascade-root");
    const child = await insertFolder(root.id, "cascade-child");
    await insertFolder(child.id, "cascade-grandchild");
    await db
      .insert(links)
      .values({ folderId: child.id, url: "https://example.com", title: "Example" });

    await db.delete(folders).where(eq(folders.id, root.id));

    const remaining = await db.select().from(folders);
    expect(remaining.find((f) => f.name === "cascade-child")).toBeUndefined();
    expect(remaining.find((f) => f.name === "cascade-grandchild")).toBeUndefined();
    expect(await db.select().from(links)).toHaveLength(0);
  });

  it("rejects duplicate sibling names case-insensitively", async () => {
    const parent = await insertFolder(null, "dup-parent");
    await insertFolder(parent.id, "Docs");

    let duplicateRejected = false;
    try {
      await insertFolder(parent.id, "docs");
    } catch {
      duplicateRejected = true;
    }

    expect(duplicateRejected).toBe(true);
    const siblings = await db.select().from(folders).where(eq(folders.parentId, parent.id));
    expect(siblings).toHaveLength(1);
  });

  it("computes ancestor depth and lists ancestors", async () => {
    const root = await insertFolder(null, "depth-root");
    const child = await insertFolder(root.id, "depth-child");
    const grandchild = await insertFolder(child.id, "depth-grandchild");

    expect(await getFolderDepth(db, grandchild.parentId)).toBe(2);
    expect(await getFolderDepth(db, null)).toBe(0);

    const ancestors = await getAncestorIds(db, grandchild.id);
    expect(ancestors.sort()).toEqual([root.id, child.id].sort());
  });
});
