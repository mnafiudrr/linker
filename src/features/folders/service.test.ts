import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getDb } from "@/db";
import { folders, users } from "@/db/schema";
import {
  createFolder,
  deleteFolder,
  moveFolder,
  renameFolder,
} from "./service";

process.env.DATABASE_URL ??= "postgres://link:link@localhost:5432/link";

const db = getDb();

let ownerId: string;
let otherId: string;

beforeAll(async () => {
  const stamp = Date.now();
  const [user] = await db
    .insert(users)
    .values({ id: `test-${stamp}`, name: "Owner", email: `o${stamp}@example.com`, emailVerified: true })
    .returning();
  const [other] = await db
    .insert(users)
    .values({ id: `other-${stamp}`, name: "Other", email: `x${stamp}@example.com`, emailVerified: true })
    .returning();
  if (!user || !other) throw new Error("failed to create test users");
  ownerId = user.id;
  otherId = other.id;
});

afterAll(async () => {
  await db.delete(users).where(eq(users.id, ownerId));
  await db.delete(users).where(eq(users.id, otherId));
});


let seedCounter = 0;

async function seedTree() {
  const suffix = ++seedCounter;
  const root = await createFolder(db, ownerId, { name: `A${suffix}` });
  if (!root.ok) throw new Error(root.message);
  const child = await createFolder(db, ownerId, { name: `B${suffix}`, parentId: root.data.id });
  if (!child.ok) throw new Error(child.message);
  return { root: root.data, child: child.data };
}

describe("createFolder", () => {
  it("creates a root folder and a nested folder", async () => {
    const { root, child } = await seedTree();
    expect(root.parentId).toBeNull();
    expect(child.parentId).toBe(root.id);
  });

  it("rejects duplicate sibling names case-insensitively", async () => {
    const root = await createFolder(db, ownerId, { name: "Dup" });
    if (!root.ok) throw new Error(root.message);

    const dup = await createFolder(db, ownerId, { name: "DUP", parentId: root.data.parentId });
    expect(dup).toMatchObject({
      ok: false,
      message: "A folder with this name already exists here.",
    });

    // Same name under a different parent is allowed.
    const parent2 = await createFolder(db, ownerId, { name: "DupParent" });
    if (!parent2.ok) throw new Error(parent2.message);
    const otherBranch = await createFolder(db, ownerId, { name: "Dup", parentId: parent2.data.id });
    expect(otherBranch.ok).toBe(true);
  });

  it("rejects invalid input with a typed error", async () => {
    const result = await createFolder(db, ownerId, { name: "" });
    expect(result).toMatchObject({ ok: false });
  });

  it("rejects when parent is missing or owned by someone else", async () => {
    const foreign = await createFolder(db, otherId, { name: "foreign" });
    if (!foreign.ok) throw new Error(foreign.message);

    const missing = await createFolder(db, ownerId, { name: "X", parentId: "00000000-0000-0000-0000-000000000000" });
    expect(missing).toMatchObject({ ok: false, message: "Parent folder not found." });

    const notOwned = await createFolder(db, ownerId, { name: "X", parentId: foreign.data.id });
    expect(notOwned).toMatchObject({ ok: false, message: "Parent folder not found." });
  });

  it("enforces the max depth limit of 10", async () => {
    const current = await createFolder(db, ownerId, { name: `depth-1-${Date.now()}` });
    if (!current.ok) throw new Error(current.message);

    for (let depth = 2; depth <= 10; depth++) {
      const next = await createFolder(db, ownerId, { name: `depth-${depth}`, parentId: current.data.id });
      if (!next.ok) throw new Error(next.message);
      current.data = next.data;
    }

    const tooDeep = await createFolder(db, ownerId, { name: "too-deep", parentId: current.data.id });
    expect(tooDeep).toMatchObject({
      ok: false,
      message: "Folders can be at most 10 levels deep.",
    });
  });
});

describe("moveFolder", () => {
  it("moves a folder into another branch", async () => {
    const { root, child } = await seedTree();
    const target = await createFolder(db, ownerId, { name: "target" });
    if (!target.ok) throw new Error(target.message);

    const moved = await moveFolder(db, ownerId, { id: child.id, newParentId: target.data.id });
    expect(moved).toMatchObject({ ok: true, data: { parentId: target.data.id } });
    void root;
  });

  it("rejects moving a folder into its own subtree", async () => {
    const { root, child } = await seedTree();

    const intoSelf = await moveFolder(db, ownerId, { id: root.id, newParentId: root.id });
    expect(intoSelf).toMatchObject({ ok: false });

    const intoChild = await moveFolder(db, ownerId, { id: root.id, newParentId: child.id });
    expect(intoChild).toMatchObject({ ok: false });
  });
});

describe("renameFolder and deleteFolder", () => {
  it("renames an owned folder", async () => {
    const { root } = await seedTree();
    const renamed = await renameFolder(db, ownerId, { id: root.id, name: "Renamed" });
    expect(renamed).toMatchObject({ ok: true, data: { name: "Renamed" } });
  });

  it("deletes only owned folders and cascades", async () => {
    const { root, child } = await seedTree();

    const foreign = await deleteFolder(db, otherId, { id: root.id });
    expect(foreign).toMatchObject({ ok: false, message: "Folder not found." });

    const deleted = await deleteFolder(db, ownerId, { id: root.id });
    expect(deleted).toMatchObject({ ok: true });

    const remaining = await db.select().from(folders).where(eq(folders.id, child.id));
    expect(remaining).toHaveLength(0);
  });
});
